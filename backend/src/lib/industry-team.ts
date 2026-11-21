import crypto from "crypto";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Largest team a company can add, besides its main account. */
export const MAX_TEAM_MEMBERS = 25;
const SETUP_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface IndustryMembership {
  industryProfileId: string;
  isMain: boolean;
}

/**
 * Which company this login may act for, read from the database on every call so that a
 * removed member or a deactivated company loses access at once, even with a valid token.
 */
export async function getIndustryMembership(userId: string): Promise<IndustryMembership | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isActive: true,
      approvalStatus: true,
      industryProfile: { select: { id: true } },
      teamIndustryProfile: {
        select: { id: true, user: { select: { isActive: true, approvalStatus: true } } },
      },
    },
  });
  if (!user || user.role !== "INDUSTRY_SPOC" || !user.isActive || user.approvalStatus !== "APPROVED") {
    return null;
  }
  if (user.industryProfile) return { industryProfileId: user.industryProfile.id, isMain: true };

  const company = user.teamIndustryProfile;
  if (company && company.user.isActive && company.user.approvalStatus === "APPROVED") {
    return { industryProfileId: company.id, isMain: false };
  }
  return null;
}

/** The company id for an industry login, or null for anyone else. */
export async function getIndustryProfileId(
  role: Role | undefined,
  userId: string | undefined
): Promise<string | null> {
  if (role !== "INDUSTRY_SPOC" || !userId) return null;
  return (await getIndustryMembership(userId))?.industryProfileId ?? null;
}

/** True when this login belongs to the company that owns a problem statement. */
export async function belongsToCompany(
  role: Role | undefined,
  userId: string | undefined,
  industryProfileId: string | null | undefined
): Promise<boolean> {
  if (!industryProfileId) return false;
  return (await getIndustryProfileId(role, userId)) === industryProfileId;
}

/** Sends an in-portal notification to everyone on a company's team. Returns how many were created. */
export async function notifyIndustryTeam(
  industryProfileId: string,
  notification: { title: string; body: string; link?: string }
): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [{ industryProfile: { id: industryProfileId } }, { teamIndustryProfileId: industryProfileId }],
    },
    select: { id: true },
  });
  if (users.length === 0) return 0;
  const { count } = await prisma.notification.createMany({
    data: users.map(({ id }) => ({ userId: id, ...notification })),
  });
  return count;
}

/** Replaces any unused link with a new one-time link for setting a password. */
export async function createSetupLink(tx: Prisma.TransactionClient, userId: string): Promise<string> {
  await tx.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });
  const token = crypto.randomBytes(32).toString("hex");
  await tx.passwordResetToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + SETUP_LINK_TTL_MS) },
  });
  const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  return `${frontendUrl}/reset-password?token=${token}&welcome=1`;
}
