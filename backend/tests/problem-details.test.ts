import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as submitPublic } from "../src/app/api/public/challenges/route";
import { PATCH as patchChallenge } from "../src/app/api/challenges/[id]/route";
import { PublicChallengeSchema, problemDetailData } from "../src/lib/validations/challenge";
import { serializeChallenge } from "../src/lib/serializers";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

vi.mock("../src/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../src/lib/email", () => ({ sendProblemReceivedEmail: vi.fn().mockResolvedValue({}) }));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    challenge: { count: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    industryProfile: { findFirst: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const details = {
  existingProcess: "Operators inspect each batch by hand twice a shift.",
  expectedOutcome: "Automatic alerts before foam overflows.",
  projectObjectives: "1. Detect foam early\n2. Trigger anti-foam dosing",
  requiredSkills: ["Computer vision", "PLC integration"],
  preferredBranches: ["Electronics", "Chemical"],
  preferredAcademicYear: "Final year UG",
  difficultyLevel: "Hard",
  expectedDeliverables: "Working prototype and a report",
  additionalNotes: "Plant visits can be arranged.",
};

const publicBody = {
  title: "Reduce foam overflow in bioreactors",
  description: "Our bioreactors overflow with foam during peak fermentation.",
  problemStatement: "Detect and control foam formation automatically in real time.",
  domain: "RESEARCH_INNOVATION",
  deadline: future,
  budgetRange: "₹5,00,000",
  organisationName: "Acme Bio Pvt Ltd",
  orgSector: "Pharmaceuticals",
  orgCity: "Indore",
  orgState: "Madhya Pradesh",
  contactName: "Asha Rao",
  contactDesignation: "Plant Head",
  contactEmail: "asha@acme-bio.in",
  contactPhone: "+91 98765 43210",
  ...details,
};

describe("Problem details are validated and saved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.challenge.count).mockResolvedValue(0);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.challenge.create).mockImplementation((async (args: any) => ({
      id: "ch-new",
      referenceCode: args.data.referenceCode,
      title: args.data.title,
      status: args.data.status,
    })) as any);
  });

  it("stores every detail field from a public submission", async () => {
    const res = await submitPublic(
      new NextRequest("http://ciisic.test/api/public/challenges", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.2.0.1" },
        body: JSON.stringify(publicBody),
      })
    );
    expect(res.status).toBe(201);
    const data = (vi.mocked(prisma.challenge.create).mock.calls[0][0] as any).data;
    for (const [key, value] of Object.entries(details)) {
      expect(data[key]).toEqual(value);
    }
    expect(data.budgetRange).toBe("₹5,00,000");
  });

  it("rejects an unknown difficulty", () => {
    const result = PublicChallengeSchema.safeParse({ ...publicBody, difficultyLevel: "Impossible" });
    expect(result.success).toBe(false);
  });

  it("saves empty text as 'not provided' (null)", () => {
    const saved = problemDetailData({ existingProcess: "   ", difficultyLevel: "" });
    expect(saved.existingProcess).toBeNull();
    expect(saved.difficultyLevel).toBeNull();
    expect(saved.requiredSkills).toEqual([]);
  });
});

describe("Editing details", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.challenge.update).mockResolvedValue({ id: "ch-1", status: "PENDING_APPROVAL" } as any);
  });

  it("only changes the detail fields that were sent", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "admin-1", role: "CII_ADMIN" } } as any);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
      id: "ch-1",
      status: "OPEN",
      publishedAt: new Date(),
      industryProfile: { userId: "industry-user-1" },
    } as any);

    await patchChallenge(
      new NextRequest("http://ciisic.test/api/challenges/ch-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ existingProcess: "Updated by CII" }),
      }),
      { params: Promise.resolve({ id: "ch-1" }) }
    );

    const data = (vi.mocked(prisma.challenge.update).mock.calls[0][0] as any).data;
    expect(data.existingProcess).toBe("Updated by CII");
    expect(data).not.toHaveProperty("requiredSkills");
    expect(data).not.toHaveProperty("projectObjectives");
  });

  it("sends a published problem back for review when the owner edits a detail", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "industry-user-1", role: "INDUSTRY_SPOC" } } as any);
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
      id: "ch-1",
      status: "OPEN",
      publishedAt: new Date(),
      industryProfile: { userId: "industry-user-1" },
    } as any);

    await patchChallenge(
      new NextRequest("http://ciisic.test/api/challenges/ch-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requiredSkills: ["Python"] }),
      }),
      { params: Promise.resolve({ id: "ch-1" }) }
    );

    const data = (vi.mocked(prisma.challenge.update).mock.calls[0][0] as any).data;
    expect(data.status).toBe("PENDING_APPROVAL");
  });
});

describe("Problem details are returned", () => {
  it("includes the details for everyone, and empty values for older problems", () => {
    const withDetails = serializeChallenge({ id: "ch-1", ...details }, undefined, undefined);
    expect(withDetails.projectObjectives).toBe(details.projectObjectives);
    expect(withDetails.requiredSkills).toEqual(details.requiredSkills);

    const legacy = serializeChallenge({ id: "ch-2" }, undefined, undefined);
    expect(legacy.existingProcess).toBeNull();
    expect(legacy.requiredSkills).toEqual([]);
    expect(legacy.difficultyLevel).toBeNull();
  });
});
