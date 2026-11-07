import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as submitPublic } from "../src/app/api/public/challenges/route";
import { PATCH as patchChallenge } from "../src/app/api/challenges/[id]/route";
import { PublicChallengeSchema } from "../src/lib/validations/challenge";
import { emailMatchesCompany } from "../src/lib/problem-submission";
import { serializeChallenge } from "../src/lib/serializers";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import { sendProblemReceivedEmail } from "../src/lib/email";

vi.mock("../src/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../src/lib/email", () => ({
  sendProblemReceivedEmail: vi.fn().mockResolvedValue({}),
}));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    challenge: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    industryProfile: { findFirst: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const baseProblem = {
  title: "Reduce foam overflow in bioreactors",
  description: "Our bioreactors overflow with foam during peak fermentation.",
  problemStatement: "Detect and control foam formation automatically in real time.",
  domain: "RESEARCH_INNOVATION",
  deadline: future,
  contactName: "Asha Rao",
  contactDesignation: "Plant Head",
  contactEmail: "asha@acme-bio.in",
  contactPhone: "+91 98765 43210",
};

const otherOrg = {
  organisationName: "Acme Bio Pvt Ltd",
  orgSector: "Pharmaceuticals",
  orgCity: "Indore",
  orgState: "Madhya Pradesh",
};

let ipCounter = 0;
function publicRequest(body: unknown) {
  ipCounter++;
  return new NextRequest("http://ciisic.test/api/public/challenges", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}` },
    body: JSON.stringify(body),
  });
}

describe("Public submission validation", () => {
  it("requires organisation details when 'Other' is chosen", () => {
    const result = PublicChallengeSchema.safeParse(baseProblem);
    expect(result.success).toBe(false);
    const fields = result.success ? {} : result.error.flatten().fieldErrors;
    expect(fields).toHaveProperty("organisationName");
    expect(fields).toHaveProperty("orgCity");
    expect(fields).toHaveProperty("orgState");
  });

  it("accepts a registered organisation without typed organisation details", () => {
    const result = PublicChallengeSchema.safeParse({ ...baseProblem, industryProfileId: "ind-1" });
    expect(result.success).toBe(true);
  });

  it("rejects submissions that fill the hidden spam-trap field", () => {
    const result = PublicChallengeSchema.safeParse({ ...baseProblem, ...otherOrg, companyFax: "0731-555" });
    expect(result.success).toBe(false);
  });
});

describe("Email domain hint for reviewers", () => {
  it("matches the company account or website domain", () => {
    expect(emailMatchesCompany("asha@tatamotors.com", "hr@tatamotors.com", null)).toBe(true);
    expect(emailMatchesCompany("asha@in.tatamotors.com", null, "https://www.tatamotors.com")).toBe(true);
  });

  it("flags a different domain", () => {
    expect(emailMatchesCompany("someone@gmail.com", "hr@tatamotors.com", "tatamotors.com")).toBe(false);
  });

  it("returns null when there is nothing reliable to compare", () => {
    expect(emailMatchesCompany("asha@acme.in", "owner@gmail.com", null)).toBeNull();
  });
});

describe("POST /api/public/challenges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.challenge.count).mockResolvedValue(0);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null); // reference code is free
    vi.mocked(prisma.challenge.create).mockImplementation((async (args: any) => ({
      id: "ch-new",
      referenceCode: args.data.referenceCode,
      title: args.data.title,
      status: args.data.status,
    })) as any);
  });

  it("saves an 'Other' organisation submission as pending CII approval and emails the submitter", async () => {
    const res = await submitPublic(publicRequest({ ...baseProblem, ...otherOrg }));
    expect(res.status).toBe(201);

    const createArgs = vi.mocked(prisma.challenge.create).mock.calls[0][0] as any;
    expect(createArgs.data.status).toBe("PENDING_APPROVAL");
    expect(createArgs.data.submissionSource).toBe("PUBLIC");
    expect(createArgs.data.industryProfileId).toBeNull();
    expect(createArgs.data.isNewOrganisation).toBe(true);
    expect(createArgs.data.organizationName).toBe("Acme Bio Pvt Ltd");

    const json = await res.json();
    expect(json.data.referenceCode).toMatch(/^CII-\d{4}-[A-Z2-9]{6}$/);
    expect(sendProblemReceivedEmail).toHaveBeenCalledWith(
      "asha@acme-bio.in",
      "Asha Rao",
      baseProblem.title,
      json.data.referenceCode
    );
  });

  it("ignores any status sent by the client", async () => {
    await submitPublic(publicRequest({ ...baseProblem, ...otherOrg, status: "OPEN" }));
    const createArgs = vi.mocked(prisma.challenge.create).mock.calls[0][0] as any;
    expect(createArgs.data.status).toBe("PENDING_APPROVAL");
  });

  it("rejects an unknown or unapproved registered organisation", async () => {
    vi.mocked(prisma.industryProfile.findFirst).mockResolvedValue(null);
    const res = await submitPublic(publicRequest({ ...baseProblem, industryProfileId: "missing" }));
    expect(res.status).toBe(400);
    expect(prisma.challenge.create).not.toHaveBeenCalled();
  });

  it("enforces the per-email daily limit", async () => {
    vi.mocked(prisma.challenge.count).mockResolvedValue(5);
    const res = await submitPublic(publicRequest({ ...baseProblem, ...otherOrg }));
    expect(res.status).toBe(429);
    expect(prisma.challenge.create).not.toHaveBeenCalled();
  });
});

describe("Industry owners cannot bypass CII review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth as any).mockResolvedValue({
      user: { id: "industry-user-1", role: "INDUSTRY_SPOC", email: "hr@techcorp.com", name: "Industry" },
    });
  });

  function patchRequest(body: unknown) {
    return new NextRequest("http://ciisic.test/api/challenges/ch-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("blocks an owner from publishing their own problem", async () => {
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
      id: "ch-1",
      status: "PENDING_APPROVAL",
      industryProfile: { userId: "industry-user-1" },
    } as any);

    const res = await patchChallenge(patchRequest({ status: "OPEN" }), { params: Promise.resolve({ id: "ch-1" }) });
    expect(res.status).toBe(403);
    expect(prisma.challenge.update).not.toHaveBeenCalled();
  });

  it("sends an approved problem back for review when the owner edits it", async () => {
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
      id: "ch-1",
      status: "OPEN",
      publishedAt: new Date(),
      industryProfile: { userId: "industry-user-1" },
    } as any);
    vi.mocked(prisma.challenge.update).mockResolvedValue({ id: "ch-1", status: "PENDING_APPROVAL" } as any);

    const res = await patchChallenge(patchRequest({ title: "A brand new title for this problem" }), {
      params: Promise.resolve({ id: "ch-1" }),
    });
    expect(res.status).toBe(200);
    const updateArgs = vi.mocked(prisma.challenge.update).mock.calls[0][0] as any;
    expect(updateArgs.data.status).toBe("PENDING_APPROVAL");
  });
});

describe("Challenge privacy", () => {
  const raw = {
    id: "ch-1",
    title: "Problem",
    status: "OPEN",
    referenceCode: "CII-2026-ABCDEF",
    industryProfileId: "ind-1",
    contactName: "Asha Rao",
    contactEmail: "asha@techcorp.com",
    contactPhone: "+91 98765 43210",
    orgCity: "Indore",
    orgAddress: "Plot 4, Sector 2",
    submissionSource: "PUBLIC",
    industryProfile: {
      userId: "industry-user-1",
      companyName: "TechCorp",
      industry: "IT",
      websiteUrl: "https://techcorp.com",
      user: { email: "hr@techcorp.com", name: "Rahul" },
    },
  };

  it("hides contact details and the reference ID from the public", () => {
    const pub = serializeChallenge(raw, undefined, undefined);
    expect(pub.contact).toBeUndefined();
    expect(pub.referenceCode).toBeUndefined();
    expect(pub.industry.email).toBeUndefined();
    expect(pub.organisation.address).toBeUndefined();
    expect(pub.organisation.city).toBe("Indore");
    expect(pub.review).toBeUndefined();
  });

  it("hides contact details from institutions and other companies", () => {
    expect(serializeChallenge(raw, "INSTITUTION_SPOC", "spoc-1").contact).toBeUndefined();
    expect(serializeChallenge(raw, "INDUSTRY_SPOC", "industry-user-2").contact).toBeUndefined();
  });

  it("shows contact details to the owning company", () => {
    const owner = serializeChallenge(raw, "INDUSTRY_SPOC", "industry-user-1");
    expect(owner.ownedByRequester).toBe(true);
    expect(owner.contact?.email).toBe("asha@techcorp.com");
    expect(owner.review).toBeUndefined();
  });

  it("gives admins the reviewer hints", () => {
    const admin = serializeChallenge(raw, "CII_ADMIN", "admin-1");
    expect(admin.contact?.phone).toBe("+91 98765 43210");
    expect(admin.review).toEqual({ registeredCompany: true, emailMatchesCompany: true, inviteSentAt: null });
  });
});
