import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized } from "@/lib/api-response";
import { getIndustryMembership } from "@/lib/industry-team";

/**
 * GET /api/auth/me
 * Returns the current authenticated user with their role-specific profile.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      industryProfile: true,
      teamIndustryProfile: true,
      institutionProfile: {
        include: { institution: true },
      },
    },
  });

  if (!user) {
    return unauthorized("User no longer exists");
  }

  // A removed team member or a deactivated account is signed out on its next page load
  if (!user.isActive) return unauthorized("This account is no longer active");
  if (user.role === "INDUSTRY_SPOC" && !(await getIndustryMembership(user.id))) {
    return unauthorized("This account is no longer active");
  }

  // Omit passwordHash. A team member sees their company as their own profile.
  const { passwordHash: _, teamIndustryProfile, ...safeUser } = user;

  return ok({ ...safeUser, industryProfile: user.industryProfile ?? teamIndustryProfile });
}
