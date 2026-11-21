import { vi, describe, it, expect, beforeEach } from "vitest";
import { GET as getChallenge } from "../src/app/api/challenges/[id]/route";
import { GET as getProposals } from "../src/app/api/challenges/[id]/proposals/route";
import { GET as getProposalDetail } from "../src/app/api/proposals/[id]/route";
import { serializeChallenge, serializeProposal } from "../src/lib/serializers";
import { validateProposalStatusTransition } from "../src/lib/validations/proposal";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

// Mock custom auth
vi.mock("../src/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock Prisma client
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({
        role: "INDUSTRY_SPOC",
        isActive: true,
        approvalStatus: "APPROVED",
        industryProfile: { id: where.id === "industry-user-1" ? "ind-1" : "ind-2" },
        teamIndustryProfile: null,
      })),
      findMany: vi.fn().mockResolvedValue([{ id: "industry-user-1" }]),
    },
    challenge: {
      findUnique: vi.fn(),
      update: vi.fn().mockReturnValue({ catch: vi.fn() }),
    },
    proposal: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    institutionProfile: {
      findUnique: vi.fn(),
    },
    industryProfile: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

describe("RBAC & Object-Level Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Challenge Status & Visibility", () => {
    it("should allow a guest to view an OPEN challenge", async () => {
      // Mock unauthenticated session
      vi.mocked(auth as any).mockResolvedValue(null);

      // Mock open challenge in DB
      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "challenge-1",
        title: "Open Challenge",
        status: "OPEN",
        description: "Open challenge description",
        problemStatement: "Problem",
        domain: "AI_IN_BUSINESS",
        deadline: new Date(),
        budgetRange: "₹50k",
        tags: [],
        viewCount: 10,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        industryProfileId: "ind-1",
        industryProfile: {
          userId: "industry-user-1",
          companyName: "TechCorp",
          industry: "Tech",
          logoUrl: null,
          isCIIMember: true,
        },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/challenges/challenge-1");
      const res = await getChallenge(req, { params: Promise.resolve({ id: "challenge-1" }) });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe("Open Challenge");
    });

    it("should block an institution SPOC from viewing a DRAFT challenge", async () => {
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: "spoc-user-1", role: "INSTITUTION_SPOC", email: "spoc@jlu.edu.in", name: "SPOC" },
        expires: "",
      });

      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "challenge-2",
        title: "Draft Challenge",
        status: "DRAFT",
        industryProfileId: "ind-1", industryProfile: { userId: "industry-user-1" },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/challenges/challenge-2");
      const res = await getChallenge(req, { params: Promise.resolve({ id: "challenge-2" }) });

      expect(res.status).toBe(404); // Returns 404 for security / obfuscation
    });

    it("should allow the creator Industry SPOC to view their own DRAFT challenge", async () => {
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: "industry-user-1", role: "INDUSTRY_SPOC", email: "hr@techcorp.com", name: "Industry" },
        expires: "",
      });

      vi.mocked(prisma.challenge.findUnique).mockResolvedValue({
        id: "challenge-2",
        title: "Draft Challenge",
        status: "DRAFT",
        industryProfileId: "ind-1", industryProfile: { userId: "industry-user-1" },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/challenges/challenge-2");
      const res = await getChallenge(req, { params: Promise.resolve({ id: "challenge-2" }) });

      expect(res.status).toBe(200);
    });
  });

  describe("Proposal Authorization & Filtering", () => {
    it("should block an industry SPOC from viewing a proposal on another company's challenge", async () => {
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: "industry-user-2", role: "INDUSTRY_SPOC", email: "other@corp.com", name: "Other Industry" },
        expires: "",
      });

      vi.mocked(prisma.proposal.findUnique).mockResolvedValue({
        id: "prop-1",
        institutionId: "inst-1",
        challenge: { industryProfileId: "ind-1", industryProfile: { userId: "industry-user-1" } },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/proposals/prop-1");
      const res = await getProposalDetail(req, { params: Promise.resolve({ id: "prop-1" }) });

      expect(res.status).toBe(403);
    });

    it("should allow the challenge's industry SPOC to view a proposal", async () => {
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: "industry-user-1", role: "INDUSTRY_SPOC", email: "hr@techcorp.com", name: "Industry" },
        expires: "",
      });

      vi.mocked(prisma.proposal.findUnique).mockResolvedValue({
        id: "prop-1",
        institutionId: "inst-1",
        challenge: { industryProfileId: "ind-1", industryProfile: { userId: "industry-user-1" } },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/proposals/prop-1");
      const res = await getProposalDetail(req, { params: Promise.resolve({ id: "prop-1" }) });

      expect(res.status).toBe(200);
    });

    it("should allow institution SPOC to view their own institution's proposal", async () => {
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: "spoc-user-1", role: "INSTITUTION_SPOC", email: "spoc@jlu.edu.in", name: "SPOC" },
        expires: "",
      });

      vi.mocked(prisma.institutionProfile.findUnique).mockResolvedValue({
        institutionId: "inst-1",
      } as any);

      vi.mocked(prisma.proposal.findUnique).mockResolvedValue({
        id: "prop-1",
        institutionId: "inst-1",
        challenge: { industryProfileId: "ind-1", industryProfile: { userId: "industry-user-1" } },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/proposals/prop-1");
      const res = await getProposalDetail(req, { params: Promise.resolve({ id: "prop-1" }) });

      expect(res.status).toBe(200);
    });

    it("should block institution SPOC from viewing another institution's proposal", async () => {
      vi.mocked(auth as any).mockResolvedValue({
        user: { id: "spoc-user-1", role: "INSTITUTION_SPOC", email: "spoc@jlu.edu.in", name: "SPOC" },
        expires: "",
      });

      vi.mocked(prisma.institutionProfile.findUnique).mockResolvedValue({
        institutionId: "inst-2", // different institution
      } as any);

      vi.mocked(prisma.proposal.findUnique).mockResolvedValue({
        id: "prop-1",
        institutionId: "inst-1",
        challenge: { industryProfileId: "ind-1", industryProfile: { userId: "industry-user-1" } },
      } as any);

      const req = new NextRequest("http://ciisic.test/api/proposals/prop-1");
      const res = await getProposalDetail(req, { params: Promise.resolve({ id: "prop-1" }) });

      expect(res.status).toBe(403);
    });
  });
});

describe("Data Privacy & Serializers", () => {
  it("should strip challenge budget range from public visitors", () => {
    const rawChallenge = {
      id: "ch-1",
      title: "Test Challenge",
      budgetRange: "₹1,00,000",
      industryProfile: {
        userId: "ind-1",
        companyName: "TechCorp",
        industry: "IT",
      },
    };

    const publicSerialized = serializeChallenge(rawChallenge, undefined, undefined);
    expect(publicSerialized.budgetRange).toBeUndefined();

    const adminSerialized = serializeChallenge(rawChallenge, "CII_ADMIN", "admin-1");
    expect(adminSerialized.budgetRange).toBe("₹1,00,000");
  });

  it("should strip team contact details from industry SPOC", () => {
    const rawProposal = {
      id: "prop-1",
      status: "SUBMITTED",
      summary: "Approach summary",
      institutionId: "inst-1",
      institution: { name: "Jagran Lakecity University", city: "Bhopal" },
      teamName: "JLU Data Insights Lab",
      teamLead: { name: "Arjun Verma", email: "arjun@jlu.edu.in", department: "CS", yearOfStudy: "3rd Year" },
      teamMembers: [{ name: "Neha Tiwari", email: "neha@jlu.edu.in", role: "ML Engineer" }],
      facultyMentor: { name: "Dr. Priya Sharma", designation: "Associate Professor", email: "spoc@jlu.edu.in" },
    };

    // Industry SPOC: team composition only
    const industry = serializeProposal(rawProposal, "INDUSTRY_SPOC", "industry-1");
    expect(industry.team?.name).toBe("JLU Data Insights Lab");
    expect(industry.team?.lead.name).toBeUndefined();
    expect(industry.team?.lead.email).toBeUndefined();
    expect(industry.team?.lead.department).toBe("CS");
    expect(industry.team?.members[0].name).toBeUndefined();
    expect(industry.team?.members[0].role).toBe("ML Engineer");
    expect(industry.team?.mentor?.email).toBeUndefined();
    expect(industry.institution?.name).toBe("Jagran Lakecity University");

    // Admin: everything
    const admin = serializeProposal(rawProposal, "CII_ADMIN", "admin-1");
    expect(admin.team?.lead.name).toBe("Arjun Verma");
    expect(admin.team?.members[0].email).toBe("neha@jlu.edu.in");

    // Owning institution SPOC: everything; another institution: no PII
    const owner = serializeProposal(rawProposal, "INSTITUTION_SPOC", "spoc-1", "inst-1");
    expect(owner.team?.lead.email).toBe("arjun@jlu.edu.in");
    const other = serializeProposal(rawProposal, "INSTITUTION_SPOC", "spoc-2", "inst-2");
    expect(other.team?.lead.email).toBeUndefined();
  });
});

describe("Proposal Workflow State Transitions", () => {
  it("should validate legal state flow transitions", () => {
    expect(validateProposalStatusTransition("DRAFT", "SUBMITTED")).toBe(true);
    expect(validateProposalStatusTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(validateProposalStatusTransition("UNDER_REVIEW", "REVISION_REQUESTED")).toBe(true);
    expect(validateProposalStatusTransition("REVISION_REQUESTED", "RESUBMITTED")).toBe(true);
    expect(validateProposalStatusTransition("RESUBMITTED", "APPROVED")).toBe(true);
  });

  it("should reject illegal transitions", () => {
    expect(validateProposalStatusTransition("APPROVED", "DRAFT")).toBe(false);
    expect(validateProposalStatusTransition("REJECTED", "SUBMITTED")).toBe(false);
    expect(validateProposalStatusTransition("DRAFT", "APPROVED")).toBe(false);
  });
});
