import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/lib/prisma";
import { belongsToCompany, getIndustryMembership, notifyIndustryTeam } from "../src/lib/industry-team";

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));

const activeCompany = { id: "company-1", user: { isActive: true, approvalStatus: "APPROVED" } };
const login = (overrides: Record<string, unknown>) => ({
  role: "INDUSTRY_SPOC",
  isActive: true,
  approvalStatus: "APPROVED",
  industryProfile: null,
  teamIndustryProfile: null,
  ...overrides,
});
const asUser = (user: unknown) => vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);

describe("Which company a login can act for", () => {
  beforeEach(() => vi.clearAllMocks());

  it("the main account manages its company", async () => {
    asUser(login({ industryProfile: { id: "company-1" } }));
    expect(await getIndustryMembership("u1")).toEqual({ industryProfileId: "company-1", isMain: true });
  });

  it("a team member acts for the company but is not the main account", async () => {
    asUser(login({ teamIndustryProfile: activeCompany }));
    expect(await getIndustryMembership("u2")).toEqual({ industryProfileId: "company-1", isMain: false });
  });

  it("a team member loses access when the company's main account is deactivated", async () => {
    asUser(login({ teamIndustryProfile: { id: "company-1", user: { isActive: false, approvalStatus: "APPROVED" } } }));
    expect(await getIndustryMembership("u2")).toBeNull();
  });

  it("a removed, inactive or unapproved login has no company", async () => {
    for (const user of [
      login({}),
      login({ isActive: false, teamIndustryProfile: activeCompany }),
      login({ approvalStatus: "PENDING", industryProfile: { id: "company-1" } }),
      login({ role: "INSTITUTION_SPOC", industryProfile: { id: "company-1" } }),
      null,
    ]) {
      asUser(user);
      expect(await getIndustryMembership("u3")).toBeNull();
    }
  });

  it("never matches a problem that has no company", async () => {
    asUser(login({}));
    expect(await belongsToCompany("INDUSTRY_SPOC", "u3", null)).toBe(false);
  });

  it("does not match another company's problem", async () => {
    asUser(login({ teamIndustryProfile: activeCompany }));
    expect(await belongsToCompany("INDUSTRY_SPOC", "u2", "company-1")).toBe(true);
    expect(await belongsToCompany("INDUSTRY_SPOC", "u2", "company-2")).toBe(false);
  });

  it("notifies everyone on the team", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: "u1" }, { id: "u2" }] as never);
    vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 2 });
    expect(await notifyIndustryTeam("company-1", { title: "T", body: "B" })).toBe(2);
    const { data } = vi.mocked(prisma.notification.createMany).mock.calls[0][0] as { data: { userId: string }[] };
    expect(data.map((n) => n.userId)).toEqual(["u1", "u2"]);
  });
});
