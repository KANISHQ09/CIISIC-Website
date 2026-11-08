import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getStats } from "../src/app/api/admin/stats/route";
import { GET as getAudit } from "../src/app/api/admin/audit/route";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

vi.mock("../src/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: { count: vi.fn(), groupBy: vi.fn() },
    institution: { count: vi.fn() },
    challenge: { count: vi.fn(), groupBy: vi.fn() },
    proposal: { count: vi.fn(), groupBy: vi.fn() },
    auditLog: { findMany: vi.fn(), count: vi.fn() },
  },
}));

const asAdmin = () =>
  vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "CII_ADMIN" } } as any);

describe("Admin overview numbers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.challenge.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.proposal.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.institution.count).mockResolvedValue(6);
  });

  it("is admin-only", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "INDUSTRY_SPOC" } } as any);
    expect((await getStats()).status).toBe(403);
  });

  it("reports what is waiting for CII", async () => {
    asAdmin();
    vi.mocked(prisma.challenge.count).mockImplementation((async (args?: any) => {
      if (args?.where?.status === "PENDING_APPROVAL" && args.where.submissionSource === "PUBLIC") return 2;
      if (args?.where?.status === "PENDING_APPROVAL") return 5;
      if (args?.where?.status === "OPEN") return 9;
      return 20;
    }) as any);
    vi.mocked(prisma.user.count).mockImplementation((async (args?: any) => {
      if (args?.where?.approvalStatus === "PENDING") return 3;
      if (args?.where?.role === "INDUSTRY_SPOC") return 4;
      return 30;
    }) as any);
    vi.mocked(prisma.proposal.count).mockImplementation((async (args?: any) => {
      if (args?.where?.status?.in) return 7;
      if (args?.where?.status === "APPROVED") return 1;
      return 12;
    }) as any);

    const json = await (await getStats()).json();
    expect(json.data.summary).toMatchObject({
      pendingProblems: 5,
      publicPendingProblems: 2,
      pendingRegistrations: 3,
      solutionsAwaitingReview: 7,
      registeredIndustries: 4,
      activeChallenges: 9,
      totalInstitutions: 6,
    });
  });
});

describe("Activity log filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
  });

  const query = async (qs: string) => {
    const res = await getAudit(new NextRequest(`http://ciisic.test/api/admin/audit?${qs}`));
    return { res, where: (vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any).where };
  };

  it("searches by person name or email", async () => {
    const { where } = await query("q=priya");
    expect(where.user.OR[0].name.contains).toBe("priya");
    expect(where.user.OR[1].email.contains).toBe("priya");
  });

  it("includes the whole 'to' day", async () => {
    const { where } = await query("from=2026-11-01&to=2026-11-07");
    expect(where.createdAt.gte).toEqual(new Date("2026-11-01"));
    expect(where.createdAt.lte.getHours()).toBe(23);
    expect(where.createdAt.lte.getMinutes()).toBe(59);
  });

  it("ignores invalid dates and page numbers instead of failing", async () => {
    const { res, where } = await query("from=not-a-date&to=also-bad&page=abc&limit=xyz");
    expect(res.status).toBe(200);
    expect(where.createdAt).toBeUndefined();
    const args = vi.mocked(prisma.auditLog.findMany).mock.calls[0][0] as any;
    expect(args.skip).toBe(0);
    expect(args.take).toBe(20);
  });

  it("is admin-only", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "INSTITUTION_SPOC" } } as any);
    const res = await getAudit(new NextRequest("http://ciisic.test/api/admin/audit"));
    expect(res.status).toBe(403);
  });
});
