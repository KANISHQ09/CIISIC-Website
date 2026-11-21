import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { getIndustryMembership } from "@/lib/industry-team";
import { forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api-response";

/**
 * DELETE /api/industry/team/[id] — main account removes a member.
 * The account is kept for the activity history, but it can no longer sign in or act for the company.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const membership = await getIndustryMembership(session.user.id);
    if (!membership?.isMain) return forbidden("Only the company's main account can remove team members");

    const member = await prisma.user.findFirst({
      where: { id, teamIndustryProfileId: membership.industryProfileId },
      select: { id: true, email: true },
    });
    if (!member) return notFound("Team member not found");

    await prisma.$transaction([
      prisma.user.update({
        where: { id: member.id },
        data: { isActive: false, teamIndustryProfileId: null, passwordHash: null },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: member.id } }),
      prisma.session.deleteMany({ where: { userId: member.id } }),
    ]);

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TEAM_MEMBER_REMOVED",
      entityType: "User",
      entityId: member.id,
      oldValue: { industryProfileId: membership.industryProfileId, email: member.email },
      ipAddress,
      userAgent,
    });

    return ok({ message: "Team member removed" });
  } catch (err) {
    console.error("[DELETE /api/industry/team/[id]]", err);
    return serverError();
  }
}
