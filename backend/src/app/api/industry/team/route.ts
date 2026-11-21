import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { isRateLimited } from "@/lib/rate-limit";
import { createSetupLink, getIndustryMembership, MAX_TEAM_MEMBERS } from "@/lib/industry-team";
import {
  badRequest,
  conflict,
  created,
  forbidden,
  ok,
  serverError,
  tooManyRequests,
  unauthorized,
  validationError,
} from "@/lib/api-response";

const AddMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

const toMember = (
  user: { id: string; name: string; email: string; passwordHash: string | null; createdAt: Date },
  isMain: boolean
) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isMain,
  status: user.passwordHash ? ("ACTIVE" as const) : ("INVITED" as const),
  createdAt: user.createdAt,
});

const MEMBER_FIELDS = { id: true, name: true, email: true, passwordHash: true, createdAt: true } as const;

/** GET /api/industry/team — everyone who can sign in for this company. */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const membership = await getIndustryMembership(session.user.id);
    if (!membership) return forbidden("Only industry partners have a team");

    const company = await prisma.industryProfile.findUnique({
      where: { id: membership.industryProfileId },
      select: {
        companyName: true,
        user: { select: MEMBER_FIELDS },
        teamMembers: { where: { isActive: true }, select: MEMBER_FIELDS, orderBy: { createdAt: "asc" } },
      },
    });
    if (!company) return forbidden("Only industry partners have a team");

    return ok({
      companyName: company.companyName,
      canManage: membership.isMain,
      maxMembers: MAX_TEAM_MEMBERS,
      members: [toMember(company.user, true), ...company.teamMembers.map((m) => toMember(m, false))],
    });
  } catch (err) {
    console.error("[GET /api/industry/team]", err);
    return serverError();
  }
}

/** POST /api/industry/team — main account adds a colleague and receives a one-time link to share. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    const membership = await getIndustryMembership(session.user.id);
    if (!membership?.isMain) return forbidden("Only the company's main account can add team members");
    const companyId = membership.industryProfileId;

    if (await isRateLimited(`team-add:${companyId}`, 30, 60 * 60 * 1000)) {
      return tooManyRequests("Too many team changes. Please try again in an hour.");
    }

    const parsed = AddMemberSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error.flatten());
    const { name, email } = parsed.data;

    const teamSize = await prisma.user.count({ where: { teamIndustryProfileId: companyId, isActive: true } });
    if (teamSize >= MAX_TEAM_MEMBERS) {
      return badRequest(`A company can have up to ${MAX_TEAM_MEMBERS} team members.`);
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true,
        role: true,
        isActive: true,
        approvalStatus: true,
        passwordHash: true,
        teamIndustryProfileId: true,
        industryProfile: { select: { id: true } },
      },
    });

    // Only someone previously removed from a team, with no password left, can be added again
    const wasRemoved =
      !!existing &&
      existing.role === "INDUSTRY_SPOC" &&
      !existing.isActive &&
      existing.approvalStatus === "APPROVED" &&
      !existing.passwordHash &&
      !existing.teamIndustryProfileId &&
      !existing.industryProfile;
    if (existing && !wasRemoved) {
      return conflict("This email already has a portal account. Please use another email or contact CII.");
    }

    const { user, setupUrl } = await prisma.$transaction(async (tx) => {
      const teamData = { name, teamIndustryProfileId: companyId, isActive: true, approvalStatus: "APPROVED" };
      const user = existing
        ? await tx.user.update({ where: { id: existing.id }, data: teamData, select: MEMBER_FIELDS })
        : await tx.user.create({
            data: { ...teamData, email, role: "INDUSTRY_SPOC" },
            select: MEMBER_FIELDS,
          });
      return { user, setupUrl: await createSetupLink(tx, user.id) };
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TEAM_MEMBER_ADDED",
      entityType: "User",
      entityId: user.id,
      newValue: { industryProfileId: companyId, email: user.email },
      ipAddress,
      userAgent,
    });

    return created({ member: toMember(user, false), setupUrl });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return conflict("This email already has a portal account. Please use another email or contact CII.");
    }
    console.error("[POST /api/industry/team]", err);
    return serverError();
  }
}
