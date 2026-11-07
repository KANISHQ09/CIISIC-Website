import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { sendIndustryInviteEmail } from "@/lib/email";
import {
  ok,
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
  serverError,
} from "@/lib/api-response";

/**
 * POST /api/admin/challenges/[id]/invite
 * Admin only — email the submitter of an "Other" (unregistered organisation) problem
 * an invitation to register on the industry portal, so the organisation appears in the
 * dropdown next time. Can be sent once per problem statement.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "CII_ADMIN";
    if (!isAdmin) return forbidden("Only administrators can send invitations");

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: {
        id: true,
        industryProfileId: true,
        isNewOrganisation: true,
        organizationName: true,
        contactName: true,
        contactEmail: true,
        inviteSentAt: true,
      },
    });
    if (!challenge) return notFound("Challenge not found");

    if (challenge.industryProfileId || !challenge.isNewOrganisation) {
      return badRequest("This organisation is already registered on the portal");
    }
    if (!challenge.contactEmail) {
      return badRequest("No contact email was provided with this submission");
    }
    if (challenge.inviteSentAt) {
      return conflict("An invitation has already been sent for this submission");
    }

    // Someone may have registered with this email since the problem was submitted
    const existingUser = await prisma.user.findUnique({
      where: { email: challenge.contactEmail },
      select: { id: true },
    });
    if (existingUser) {
      return conflict("An account with this email already exists");
    }

    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const query = new URLSearchParams({ company: challenge.organizationName ?? "" });
    const registerUrl = `${frontendUrl}/industry/register?${query.toString()}`;

    await sendIndustryInviteEmail(
      challenge.contactEmail,
      challenge.contactName ?? "there",
      challenge.organizationName ?? "your organisation",
      registerUrl
    );

    const updated = await prisma.challenge.update({
      where: { id },
      data: { inviteSentAt: new Date() },
      select: { inviteSentAt: true },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: "INDUSTRY_INVITE_SENT",
      entityType: "Challenge",
      entityId: id,
      newValue: { organisation: challenge.organizationName },
      ipAddress,
      userAgent,
    });

    return ok({ inviteSentAt: updated.inviteSentAt });
  } catch (err) {
    console.error("[POST /api/admin/challenges/[id]/invite]", err);
    return serverError();
  }
}
