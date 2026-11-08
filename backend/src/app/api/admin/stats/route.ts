import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ok,
  forbidden,
  unauthorized,
  serverError,
} from "@/lib/api-response";

/**
 * GET /api/admin/stats
 * Admin only — platform-wide KPI metrics.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const isAdmin =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "CII_ADMIN";
    if (!isAdmin) return forbidden("Admin access required");

    const [
      totalUsers,
      totalInstitutions,
      totalChallenges,
      totalProposals,
      activeChallengees,
      openProposals,
      approvedProposals,
      usersByRole,
      challengesByDomain,
      proposalsByStatus,
      recentActivity,
      pendingProblems,
      publicPendingProblems,
      pendingRegistrations,
      registeredIndustries,
      solutionsAwaitingReview,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.institution.count(),
      prisma.challenge.count(),
      prisma.proposal.count(),
      prisma.challenge.count({ where: { status: "OPEN" } }),
      prisma.proposal.count({ where: { status: "SUBMITTED" } }),
      prisma.proposal.count({ where: { status: "APPROVED" } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      prisma.challenge.groupBy({
        by: ["domain"],
        _count: { domain: true },
      }),
      prisma.proposal.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, role: true } },
        },
      }),
      prisma.challenge.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.challenge.count({ where: { status: "PENDING_APPROVAL", submissionSource: "PUBLIC" } }),
      prisma.user.count({
        where: { approvalStatus: "PENDING", role: { in: ["INDUSTRY_SPOC", "INSTITUTION_SPOC"] } },
      }),
      prisma.user.count({ where: { role: "INDUSTRY_SPOC", approvalStatus: "APPROVED", isActive: true } }),
      prisma.proposal.count({ where: { status: { in: ["SUBMITTED", "RESUBMITTED", "UNDER_REVIEW"] } } }),
    ]);

    return ok({
      summary: {
        totalUsers,
        totalInstitutions,
        totalChallenges,
        totalProposals,
        activeChallenges: activeChallengees,
        pendingProposals: openProposals,
        approvedProposals,
        // What needs CII's attention
        pendingProblems,
        publicPendingProblems,
        pendingRegistrations,
        solutionsAwaitingReview,
        registeredIndustries,
      },
      breakdowns: {
        usersByRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count.role,
        })),
        challengesByDomain: challengesByDomain.map((d) => ({
          domain: d.domain,
          count: d._count.domain,
        })),
        proposalsByStatus: proposalsByStatus.map((s) => ({
          status: s.status,
          count: s._count.status,
        })),
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: log.user,
        createdAt: log.createdAt,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return serverError();
  }
}
