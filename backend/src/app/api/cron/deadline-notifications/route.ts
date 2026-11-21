import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyIndustryTeam } from "@/lib/industry-team";

/**
 * GET /api/cron/deadline-notifications
 * System cron trigger to find challenges with deadlines approaching in < 48 hours
 * and notify relevant users (Industry SPOC owner and participating institutions).
 * Protected by the CRON_SECRET environment variable.
 */
export async function GET(req: NextRequest) {
  // Only the scheduler may run this: it must send "Authorization: Bearer <CRON_SECRET>"
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { success: false, message: "Scheduled jobs are not configured (CRON_SECRET is not set)" },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const threshold = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Find all open challenges ending soon
    const challenges = await prisma.challenge.findMany({
      where: {
        status: "OPEN",
        deadline: {
          gt: now,
          lte: threshold,
        },
      },
      include: {
        industryProfile: true,
        proposals: {
          select: {
            submittedById: true,
            institution: { select: { institutionProfile: { select: { userId: true } } } },
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const challenge of challenges) {
      const challengeLink = `/api/challenges/${challenge.id}`;

      // Check if we already sent a deadline warning notification for this challenge
      const existingNotification = await prisma.notification.findFirst({
        where: {
          link: challengeLink,
          title: {
            contains: "Deadline Approaching",
          },
        },
      });

      if (existingNotification) {
        continue;
      }

      const deadlineStr = challenge.deadline.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
      });

      // 1. Notify Industry SPOC (only when the problem belongs to a registered account)
      if (challenge.industryProfile) {
        notificationsCreated += await notifyIndustryTeam(challenge.industryProfile.id, {
          title: "Challenge Deadline Approaching",
          body: `The deadline for your project "${challenge.title}" is approaching on ${deadlineStr}.`,
          link: challengeLink,
        });
      }

      // 2. Notify each institution that submitted/drafted a proposal for this challenge (once each)
      const institutionUserIds = new Set(
        challenge.proposals
          .map((p) => p.institution?.institutionProfile?.userId ?? p.submittedById)
          .filter((uid): uid is string => !!uid)
      );
      for (const userId of institutionUserIds) {
        await prisma.notification.create({
          data: {
            userId,
            title: "Challenge Deadline Approaching",
            body: `The deadline for the project "${challenge.title}" you applied to is approaching on ${deadlineStr}.`,
            link: challengeLink,
          },
        });
        notificationsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${challenges.length} challenges. Sent ${notificationsCreated} notifications.`,
    });
  } catch (err) {
    console.error("[GET /api/cron/deadline-notifications] Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
