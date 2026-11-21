import { Role } from "@prisma/client";
import { emailMatchesCompany } from "@/lib/problem-submission";

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
    email?: string; // admins and the owning company only
    representativeName?: string; // admins and the owning company only
  };
  _count?: { proposals: number };
  attachmentUrls?: string[];
  // Details from the submission form (null/empty for older problems)
  existingProcess: string | null;
  expectedOutcome: string | null;
  projectObjectives: string | null;
  requiredSkills: string[];
  preferredBranches: string[];
  preferredAcademicYear: string | null;
  difficultyLevel: string | null;
  expectedDeliverables: string | null;
  additionalNotes: string | null;
  submissionSource: string; // PORTAL | PUBLIC
  isNewOrganisation: boolean; // submitted as "Other" (no registered account)
  ownedByRequester: boolean;
  referenceCode?: string | null; // admins and the owning company only
  organisation: {
    name: string;
    sector: string | null;
    website: string | null;
    city: string | null;
    state: string | null;
    address?: string | null; // admins and the owning company only
  };
  // Who may see the mobile number — admins and the owning company only
  phoneVisibility?: "EVERYONE" | "INSTITUTION_SPOCS" | "NO_ONE";
  // Person who submitted it — admins and the owning company. Others get only the mobile
  // number, and only when the company chose to share it with them.
  contact?: {
    name: string | null;
    designation: string | null;
    email: string | null;
    phone: string | null;
  };
  // Hints for the CII reviewer — admins only
  review?: {
    registeredCompany: boolean;
    emailMatchesCompany: boolean | null;
    inviteSentAt: Date | null;
  };
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
  deliverables: string | null;
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
    organisationName: string;
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
 * - Contact details and the reference ID: CII admins and the owning company only.
 * - Mobile number: also shared on published problems if the company chose Everyone or
 *   Institution SPOCs. Anyone else never receives it.
 * - Reviewer hints (registered company? email domain matches?): CII admins only.
 */
export function serializeChallenge(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenge: any,
  requestingRole?: Role,
  // The requester's company (see getIndustryProfileId), so every team member counts as the owner
  requestingIndustryProfileId?: string | null
): SafeChallenge {
  const isAdmin = requestingRole === "SUPER_ADMIN" || requestingRole === "CII_ADMIN";
  const isOwner =
    !!requestingIndustryProfileId &&
    requestingRole === "INDUSTRY_SPOC" &&
    challenge.industryProfileId === requestingIndustryProfileId;
  const showContact = isAdmin || isOwner;
  const phoneVisibility = challenge.phoneVisibility ?? "NO_ONE";
  const sharePhone =
    !showContact &&
    !!challenge.contactPhone &&
    challenge.status === "OPEN" &&
    (phoneVisibility === "EVERYONE" ||
      (phoneVisibility === "INSTITUTION_SPOCS" && requestingRole === "INSTITUTION_SPOC"));

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
      email: showContact ? (challenge.industryProfile?.user?.email ?? "") : undefined,
      representativeName: showContact ? (challenge.industryProfile?.user?.name ?? "") : undefined,
    },
    _count: challenge._count,
    attachmentUrls: challenge.attachmentUrls ?? [],
    existingProcess: challenge.existingProcess ?? null,
    expectedOutcome: challenge.expectedOutcome ?? null,
    projectObjectives: challenge.projectObjectives ?? null,
    requiredSkills: challenge.requiredSkills ?? [],
    preferredBranches: challenge.preferredBranches ?? [],
    preferredAcademicYear: challenge.preferredAcademicYear ?? null,
    difficultyLevel: challenge.difficultyLevel ?? null,
    expectedDeliverables: challenge.expectedDeliverables ?? null,
    additionalNotes: challenge.additionalNotes ?? null,
    submissionSource: challenge.submissionSource ?? "PORTAL",
    isNewOrganisation: challenge.isNewOrganisation ?? false,
    ownedByRequester: isOwner,
    referenceCode: showContact ? (challenge.referenceCode ?? null) : undefined,
    organisation: {
      name: challenge.organizationName ?? challenge.industryProfile?.companyName ?? "",
      sector: challenge.orgSector ?? challenge.industryProfile?.industry ?? null,
      website: challenge.orgWebsite ?? challenge.industryProfile?.websiteUrl ?? null,
      city: challenge.orgCity ?? null,
      state: challenge.orgState ?? null,
      ...(showContact && { address: challenge.orgAddress ?? null }),
    },
    contact: showContact
      ? {
          name: challenge.contactName ?? challenge.industryProfile?.user?.name ?? null,
          designation: challenge.contactDesignation ?? null,
          email: challenge.contactEmail ?? challenge.industryProfile?.user?.email ?? null,
          phone: challenge.contactPhone ?? null,
        }
      : sharePhone
      ? { name: null, designation: null, email: null, phone: challenge.contactPhone }
      : undefined,
    phoneVisibility: showContact ? phoneVisibility : undefined,
    review: isAdmin
      ? {
          registeredCompany: !!challenge.industryProfileId,
          emailMatchesCompany: challenge.industryProfileId
            ? emailMatchesCompany(
                challenge.contactEmail,
                challenge.industryProfile?.user?.email,
                challenge.industryProfile?.websiteUrl
              )
            : null,
          inviteSentAt: challenge.inviteSentAt ?? null,
        }
      : undefined,
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
    deliverables: proposal.deliverables ?? null,
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
          organisationName:
            proposal.challenge.organizationName ?? proposal.challenge.industryProfile?.companyName ?? "",
        }
      : undefined,
  };
}
