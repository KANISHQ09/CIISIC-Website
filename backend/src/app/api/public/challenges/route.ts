import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PublicChallengeSchema } from "@/lib/validations/challenge";
import { getRequestMeta } from "@/lib/audit";
import { isRateLimited } from "@/lib/rate-limit";
import { generateReferenceCode } from "@/lib/problem-submission";
import { sendProblemReceivedEmail } from "@/lib/email";
import {
  created,
  badRequest,
  serverError,
  tooManyRequests,
  validationError,
} from "@/lib/api-response";

const HOUR = 60 * 60 * 1000;
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_EMAIL_PER_DAY = 5;

/**
 * POST /api/public/challenges
 * Public — submit a problem statement without logging in.
 * Every submission is saved as PENDING_APPROVAL and is only published after a CII admin approves it.
 */
export async function POST(req: NextRequest) {
  try {
    const { ipAddress } = getRequestMeta(req);
    if (isRateLimited(`public-challenge:${ipAddress}`, MAX_PER_IP_PER_HOUR, HOUR)) {
      return tooManyRequests("Too many submissions from this network. Please try again in an hour.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid request body");
    }

    const parsed = PublicChallengeSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());
    const data = parsed.data;

    // Per-email limit stored in the database (holds across server instances)
    const recentFromEmail = await prisma.challenge.count({
      where: {
        contactEmail: data.contactEmail,
        createdAt: { gte: new Date(Date.now() - 24 * HOUR) },
      },
    });
    if (recentFromEmail >= MAX_PER_EMAIL_PER_DAY) {
      return tooManyRequests("You have reached today's submission limit. Please try again tomorrow.");
    }

    // Registered organisation picked from the dropdown?
    let industryProfile: {
      id: string;
      companyName: string;
      industry: string;
      websiteUrl: string | null;
    } | null = null;
    if (data.industryProfileId) {
      industryProfile = await prisma.industryProfile.findFirst({
        where: {
          id: data.industryProfileId,
          user: { role: "INDUSTRY_SPOC", isActive: true, approvalStatus: "APPROVED" },
        },
        select: { id: true, companyName: true, industry: true, websiteUrl: true },
      });
      if (!industryProfile) {
        return badRequest(
          'The selected organisation was not found. Choose "Other" and enter your organisation\'s details.'
        );
      }
    }

    const referenceCode = await generateReferenceCode(prisma);

    const challenge = await prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        problemStatement: data.problemStatement,
        domain: data.domain,
        deadline: new Date(data.deadline),
        budgetRange: data.budgetRange || null,
        tags: data.tags ?? [],
        attachmentUrls: data.attachmentUrls ?? [],
        duration: data.duration || null,
        status: "PENDING_APPROVAL",
        submissionSource: "PUBLIC",
        referenceCode,

        industryProfileId: industryProfile?.id ?? null,
        isNewOrganisation: !industryProfile,
        organizationName: industryProfile?.companyName ?? data.organisationName ?? null,
        orgSector: industryProfile ? industryProfile.industry : data.orgSector || null,
        orgWebsite: industryProfile ? industryProfile.websiteUrl : data.orgWebsite || null,
        orgCity: data.orgCity || null,
        orgState: data.orgState || null,
        orgAddress: data.orgAddress || null,

        contactName: data.contactName,
        contactDesignation: data.contactDesignation,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      },
      select: { id: true, referenceCode: true, title: true, status: true },
    });

    try {
      await sendProblemReceivedEmail(data.contactEmail, data.contactName, challenge.title, referenceCode);
    } catch (err) {
      console.error("[POST /api/public/challenges] Failed to send acknowledgement email:", err);
    }

    return created({
      id: challenge.id,
      referenceCode: challenge.referenceCode,
      status: challenge.status,
      message: "Your problem statement has been received and will be published after CII verification.",
    });
  } catch (err) {
    console.error("[POST /api/public/challenges]", err);
    return serverError();
  }
}
