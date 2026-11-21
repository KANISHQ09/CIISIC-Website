import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createSetupLink, getIndustryMembership } from "@/lib/industry-team";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api-response";

/** POST /api/industry/team/[id]/link — new set-password link for a member who has not joined yet. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const membership = await getIndustryMembership(session.user.id);
    if (!membership?.isMain) return forbidden("Only the company's main account can create links");

    const member = await prisma.user.findFirst({
      where: { id, teamIndustryProfileId: membership.industryProfileId, isActive: true },
      select: { id: true, passwordHash: true },
    });
    if (!member) return notFound("Team member not found");
    if (member.passwordHash) {
      return badRequest("This member has already set a password. They can use Forgot Password if needed.");
    }

    const setupUrl = await prisma.$transaction((tx) => createSetupLink(tx, member.id));

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TEAM_LINK_CREATED",
      entityType: "User",
      entityId: member.id,
      ipAddress,
      userAgent,
    });

    return ok({ setupUrl });
  } catch (err) {
    console.error("[POST /api/industry/team/[id]/link]", err);
    return serverError();
  }
}
