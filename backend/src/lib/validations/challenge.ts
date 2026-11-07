import { z } from "zod";

const DOMAINS = [
  "FAMILY_BUSINESS",
  "TALENT_READINESS",
  "RESEARCH_INNOVATION",
  "AI_IN_BUSINESS",
  "AGRITECH",
  "SKILL_DEVELOPMENT",
  "STARTUP",
] as const;

/** Person submitting a problem statement. */
const ContactSchema = z.object({
  contactName: z.string().trim().min(2, "Contact name is required").max(100),
  contactDesignation: z.string().trim().min(2, "Designation is required").max(100),
  contactEmail: z.string().trim().toLowerCase().email("A valid email address is required"),
  contactPhone: z
    .string()
    .trim()
    .min(7, "A valid phone number is required")
    .max(20)
    .regex(/^[+0-9 ()-]+$/, "Phone number can only contain digits, spaces, +, - and brackets"),
});

export const ChallengeCreateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  problemStatement: z
    .string()
    .min(20, "Problem statement must be at least 20 characters"),
  domain: z.enum([
    "FAMILY_BUSINESS",
    "TALENT_READINESS",
    "RESEARCH_INNOVATION",
    "AI_IN_BUSINESS",
    "AGRITECH",
    "SKILL_DEVELOPMENT",
    "STARTUP",
  ]),
  deadline: z.string().datetime("Invalid deadline date").refine((val) => {
    return new Date(val) > new Date();
  }, {
    message: "Deadline must be a future date",
  }),
  budgetRange: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters").max(100).optional(),
  duration: z.string().min(1, "Duration is required").max(50).optional(),
  // A new problem can only be saved as a draft or sent for CII review — never published directly
  status: z.enum(["DRAFT", "PENDING_APPROVAL"]).optional(),
  // Optional contact details captured by the submission form
  contactName: z.string().trim().max(100).optional(),
  contactDesignation: z.string().trim().max(100).optional(),
  contactEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(20).optional(),
});

export const ChallengeUpdateSchema = ChallengeCreateSchema.partial().extend({
  // Non-admins are limited to DRAFT / PENDING_APPROVAL in the route handler
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "OPEN", "REJECTED", "UNDER_REVIEW", "CLOSED", "ARCHIVED"])
    .optional(),
});

export const ChallengeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum(["DRAFT", "PENDING_APPROVAL", "OPEN", "REJECTED", "UNDER_REVIEW", "CLOSED", "ARCHIVED"])
    .optional(),
  domain: z
    .enum([
      "FAMILY_BUSINESS",
      "TALENT_READINESS",
      "RESEARCH_INNOVATION",
      "AI_IN_BUSINESS",
      "AGRITECH",
      "SKILL_DEVELOPMENT",
      "STARTUP",
    ])
    .optional(),
  deadline: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "deadline", "viewCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Public (no-login) problem submission.
 * The organisation is either a registered industry from the dropdown (industryProfileId)
 * or "Other" with the organisation's details typed in.
 */
export const PublicChallengeSchema = z
  .object({
    // Problem
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(200),
    description: z.string().trim().min(20, "Description must be at least 20 characters").max(20000),
    problemStatement: z.string().trim().min(20, "Problem statement must be at least 20 characters").max(20000),
    domain: z.enum(DOMAINS),
    deadline: z
      .string()
      .datetime("Invalid deadline date")
      .refine((val) => new Date(val) > new Date(), { message: "Deadline must be a future date" }),
    budgetRange: z.string().trim().max(200).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
    attachmentUrls: z.array(z.string().url()).max(3).optional(),
    duration: z.string().trim().max(50).optional(),

    // Organisation
    industryProfileId: z.string().trim().min(1).optional(),
    organisationName: z.string().trim().max(150).optional(),
    orgSector: z.string().trim().max(100).optional(),
    orgWebsite: z.string().trim().max(200).optional(),
    orgCity: z.string().trim().max(100).optional(),
    orgState: z.string().trim().max(100).optional(),
    orgAddress: z.string().trim().max(300).optional(),

    // Spam trap: real users never see this field, so it must stay empty
    companyFax: z.string().max(0, "Invalid submission").optional(),
  })
  .merge(ContactSchema)
  .superRefine((data, ctx) => {
    if (data.industryProfileId) return;
    const required: Array<[keyof typeof data, string]> = [
      ["organisationName", "Organisation name is required"],
      ["orgSector", "Industry sector is required"],
      ["orgCity", "City is required"],
      ["orgState", "State is required"],
    ];
    for (const [field, message] of required) {
      const value = data[field];
      if (typeof value !== "string" || value.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
    }
  });
