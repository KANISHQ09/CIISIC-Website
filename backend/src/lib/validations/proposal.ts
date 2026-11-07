import { z } from "zod";
import { ProposalStatus } from "@prisma/client";

const TeamLeadSchema = z.object({
  name: z.string().trim().min(2, "Team lead name is required").max(100),
  email: z.string().trim().email("Team lead email is invalid"),
  department: z.string().trim().max(100).optional().default(""),
  yearOfStudy: z.string().trim().max(50).optional().default(""),
  phone: z.string().trim().max(20).optional(),
});

const TeamMemberSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email("Team member email is invalid"),
  role: z.string().trim().max(60).optional(),
});

const FacultyMentorSchema = z.object({
  name: z.string().trim().max(100).optional().default(""),
  designation: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email("Mentor email is invalid").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
});

/** Solution submitted by an Institution SPOC on behalf of its team. */
export const ProposalCreateSchema = z.object({
  title: z.string().trim().max(200).optional(),
  summary: z
    .string()
    .min(20, "Summary must be at least 20 characters")
    .max(3000, "Summary must be 3000 characters or fewer"),
  detailedApproach: z.string().max(20000).optional(),
  technologiesUsed: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  demoUrl: z.string().url("Demo link must be a valid URL").optional().or(z.literal("")),
  approachDoc: z.string().optional(), // file URL/key — populated after upload
  teamName: z.string().trim().min(2, "Team name is required").max(100),
  teamLead: TeamLeadSchema,
  teamMembers: z.array(TeamMemberSchema).max(10).optional(),
  facultyMentor: FacultyMentorSchema.optional(),
  isDraft: z.boolean().default(false),
});

export const ProposalStatusUpdateSchema = z.object({
  status: z.enum([
    "UNDER_REVIEW",
    "REVISION_REQUESTED",
    "APPROVED",
    "REJECTED",
  ]),
  revisionNotes: z.string().optional(),
  feedbackByIndustry: z.string().optional(),
});

export const ProposalQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "REVISION_REQUESTED",
      "RESUBMITTED",
      "APPROVED",
      "REJECTED",
    ])
    .optional(),
});

export function validateProposalStatusTransition(
  oldStatus: ProposalStatus,
  newStatus: ProposalStatus
): boolean {
  if (oldStatus === newStatus) return true;

  switch (oldStatus) {
    case "DRAFT":
      return newStatus === "SUBMITTED";
    case "SUBMITTED":
      return (
        newStatus === "UNDER_REVIEW" ||
        newStatus === "APPROVED" ||
        newStatus === "REJECTED" ||
        newStatus === "REVISION_REQUESTED"
      );
    case "UNDER_REVIEW":
      return (
        newStatus === "APPROVED" ||
        newStatus === "REJECTED" ||
        newStatus === "REVISION_REQUESTED"
      );
    case "REVISION_REQUESTED":
      return newStatus === "RESUBMITTED";
    case "RESUBMITTED":
      return (
        newStatus === "UNDER_REVIEW" ||
        newStatus === "APPROVED" ||
        newStatus === "REJECTED"
      );
    case "APPROVED":
    case "REJECTED":
      // Terminal states — cannot transition
      return false;
    default:
      return false;
  }
}
