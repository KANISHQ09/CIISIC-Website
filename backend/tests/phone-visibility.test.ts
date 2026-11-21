import { describe, it, expect } from "vitest";
import { serializeChallenge } from "../src/lib/serializers";
import { ChallengeUpdateSchema } from "../src/lib/validations/challenge";

const PHONE = "+91 98765 43210";
const problem = (phoneVisibility: string | undefined, status = "OPEN") => ({
  id: "c1",
  title: "Reduce foam overflow",
  status,
  contactName: "Asha Rao",
  contactEmail: "asha@acme-bio.in",
  contactPhone: PHONE,
  phoneVisibility,
  industryProfile: { userId: "owner-1", companyName: "Acme Bio", user: { email: "owner@acme-bio.in" } },
});

const asVisitor = (p: unknown) => serializeChallenge(p);
const asSpoc = (p: unknown) => serializeChallenge(p, "INSTITUTION_SPOC", "spoc-1");
const asOtherCompany = (p: unknown) => serializeChallenge(p, "INDUSTRY_SPOC", "other-1");
const asOwner = (p: unknown) => serializeChallenge(p, "INDUSTRY_SPOC", "owner-1");
const asAdmin = (p: unknown) => serializeChallenge(p, "CII_ADMIN", "admin-1");

describe("Who can see a problem's mobile number", () => {
  it("Everyone: visitors, institutions and other companies get only the number", () => {
    const p = problem("EVERYONE");
    for (const viewer of [asVisitor, asSpoc, asOtherCompany]) {
      const out = viewer(p);
      expect(out.contact?.phone).toBe(PHONE);
      expect(out.contact?.email).toBeNull();
      expect(out.contact?.name).toBeNull();
      expect(out.phoneVisibility).toBeUndefined();
    }
  });

  it("Institution SPOCs only: institutions get it, visitors and other companies do not", () => {
    const p = problem("INSTITUTION_SPOCS");
    expect(asSpoc(p).contact?.phone).toBe(PHONE);
    expect(asVisitor(p).contact).toBeUndefined();
    expect(asOtherCompany(p).contact).toBeUndefined();
  });

  it("No one: nobody else receives it", () => {
    const p = problem("NO_ONE");
    for (const viewer of [asVisitor, asSpoc, asOtherCompany]) {
      expect(JSON.stringify(viewer(p))).not.toContain(PHONE);
    }
  });

  it("treats a problem without a saved choice as No one", () => {
    expect(JSON.stringify(asSpoc(problem(undefined)))).not.toContain(PHONE);
  });

  it("never shares the number of a problem that is not published", () => {
    for (const status of ["PENDING_APPROVAL", "REJECTED", "DRAFT", "CLOSED"]) {
      expect(JSON.stringify(asSpoc(problem("EVERYONE", status)))).not.toContain(PHONE);
    }
  });

  it("CII admins and the owning company always see it, and the setting", () => {
    const p = problem("NO_ONE");
    for (const viewer of [asOwner, asAdmin]) {
      const out = viewer(p);
      expect(out.contact?.phone).toBe(PHONE);
      expect(out.contact?.email).toBe("asha@acme-bio.in");
      expect(out.phoneVisibility).toBe("NO_ONE");
    }
  });

  it("rejects an unknown visibility value", () => {
    expect(ChallengeUpdateSchema.safeParse({ phoneVisibility: "FRIENDS" }).success).toBe(false);
    expect(ChallengeUpdateSchema.safeParse({ phoneVisibility: "INSTITUTION_SPOCS" }).success).toBe(true);
  });
});
