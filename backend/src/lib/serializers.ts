import { Role } from "@prisma/client";

// ─── Types returned to clients ────────────────────────────────────────────────

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
};

export type SafeChallenge = {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  domain: string;
  status: string;
  deadline: Date;
  budgetRange?: string | null; // hidden from public visitors
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  organizationName?: string | null;
  duration?: string | null;
  reviewRemarks?: string | null;
  reviewedAt?: Date | null;
  reviewerId?: string | null;
  industry: {
    companyName: string;
    industry: string;
    logoUrl: string | null;
    isCIIMember: boolean;
    email?: string;
    representativeName?: string;
  };
  _count?: { proposals: number };
  attachmentUrls?: string[];
};
export type SafeProposal = {
  id: string;
  challengeId: string;
  status: string;
  summary: string;
  approachDoc: string | null;
  revisionNotes?: string | null;
  feedbackByIndustry?: string | null; // only once a decision is final
  submittedAt: Date;
  updatedAt: Date;
  title: string | null;
  detailedApproach: string | null;
  technologiesUsed: string[];
  demoUrl: string | null;
  institution?: {
    id: string | null;
    name: string;
    city: string;
  };
  team?: {
    name: string;
    // Names, emails and phone numbers are PII: only admins and the submitting institution see them
    lead: { name?: string; email?: string; phone?: string; department: string; yearOfStudy: string };
    members: { name?: string; email?: string; role: string }[];
    mentor?: { name?: string; email?: string; phone?: string; designation: string };
  };
  challenge?: {
    title: string;
    domain: string;
  };
};

// ─── Serializers ──────────────────────────────────────────────────────────────

/**
 * Strip passwordHash and internal fields from user records.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Serialize a challenge.
 * - Public visitors (no role): budgetRange is stripped.
 */
export function serializeChallenge(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenge: any,
  requestingRole?: Role,
  requestingUserId?: string
): SafeChallenge {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    problemStatement: challenge.problemStatement,
    domain: challenge.domain,
    status: challenge.status,
    deadline: challenge.deadline,
    budgetRange: requestingRole ? (challenge.budgetRange ?? null) : undefined,
    tags: challenge.tags ?? [],
    viewCount: challenge.viewCount,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt,
    publishedAt: challenge.publishedAt,
    organizationName: challenge.organizationName,
    duration: challenge.duration,
    reviewRemarks: challenge.reviewRemarks,
    reviewedAt: challenge.reviewedAt,
    reviewerId: challenge.reviewerId,
    industry: {
      companyName: challenge.industryProfile?.companyName ?? "",
      industry: challenge.industryProfile?.industry ?? "",
      logoUrl: challenge.industryProfile?.logoUrl ?? null,
      isCIIMember: challenge.industryProfile?.isCIIMember ?? false,
      email: challenge.industryProfile?.user?.email ?? "",
      representativeName: challenge.industryProfile?.user?.name ?? "",
    },
    _count: challenge._count,
    attachmentUrls: challenge.attachmentUrls ?? [],
  };
}

/**
 * Serialize a proposal (a solution submitted by an institution's team).
 * - Admin: sees everything
 * - Institution SPOC: full details for their own institution's proposals
 * - Industry SPOC: team composition without names/emails/phones
 */
export function serializeProposal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proposal: any,
  requestingRole: Role,
  _requestingUserId?: string,
  requestingUserInstitutionId?: string
): SafeProposal {
  const isAdmin =
    requestingRole === "SUPER_ADMIN" || requestingRole === "CII_ADMIN";
  const isIndustry = requestingRole === "INDUSTRY_SPOC";
  const isInstSpocOwner =
    requestingRole === "INSTITUTION_SPOC" &&
    !!requestingUserInstitutionId &&
    proposal.institutionId === requestingUserInstitutionId;

  const showPII = isAdmin || isInstSpocOwner;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lead: any = proposal.teamLead ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members: any[] = Array.isArray(proposal.teamMembers) ? proposal.teamMembers : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mentor: any = proposal.facultyMentor ?? null;

  const team: SafeProposal["team"] = proposal.teamName
    ? {
        name: proposal.teamName,
        lead: {
          department: lead.department ?? "",
          yearOfStudy: lead.yearOfStudy ?? "",
          ...(showPII && { name: lead.name, email: lead.email, phone: lead.phone }),
        },
        members: members.map((m) => ({
          role: m.role ?? "Team Member",
          ...(showPII && { name: m.name, email: m.email }),
        })),
        mentor: mentor
          ? {
              designation: mentor.designation ?? "",
              ...(showPII && { name: mentor.name, email: mentor.email, phone: mentor.phone }),
            }
          : undefined,
      }
    : undefined;

  // Only show feedback when status is terminal
  const showFeedback =
    isAdmin ||
    ((isInstSpocOwner || isIndustry) &&
      ["APPROVED", "REJECTED"].includes(proposal.status));

  return {
    id: proposal.id,
    challengeId: proposal.challengeId,
    status: proposal.status,
    title: proposal.title ?? null,
    summary: proposal.summary,
    detailedApproach: proposal.detailedApproach ?? null,
    technologiesUsed: proposal.technologiesUsed ?? [],
    demoUrl: proposal.demoUrl ?? null,
    approachDoc: proposal.approachDoc,
    revisionNotes: proposal.revisionNotes,
    feedbackByIndustry: showFeedback ? proposal.feedbackByIndustry : undefined,
    submittedAt: proposal.submittedAt,
    updatedAt: proposal.updatedAt,
    institution: proposal.institution
      ? {
          id: proposal.institutionId ?? null,
          name: proposal.institution.name,
          city: proposal.institution.city,
        }
      : undefined,
    team,
    challenge: proposal.challenge
      ? {
          title: proposal.challenge.title,
          domain: proposal.challenge.domain,
        }
      : undefined,
  };
}
