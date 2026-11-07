import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProposalStatus } from "@prisma/client";
import { ProposalCreateSchema, ProposalQuerySchema } from "@/lib/validations/proposal";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { serializeProposal } from "@/lib/serializers";
import {
  ok,
  created,
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
  serverError,
  validationError,
} from "@/lib/api-response";

/**
 * GET /api/challenges/[id]/proposals
 * - Industry SPOC: see proposals for own challenge (team contact details hidden)
 * - Institution SPOC: see only their own institution's proposals
 * - Admin: see all proposals for challenge
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { searchParams } = new URL(req.url);
    const queryParsed = ProposalQuerySchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });
    if (!queryParsed.success) return validationError(queryParsed.error.flatten());
    const { page, limit, status } = queryParsed.data;

    const role = session.user.role;
    const isAdmin = role === "SUPER_ADMIN" || role === "CII_ADMIN";
    const isIndustry = role === "INDUSTRY_SPOC";
    const isInstitutionSpoc = role === "INSTITUTION_SPOC";

    if (!isAdmin && !isIndustry && !isInstitutionSpoc) {
      return forbidden("Access denied");
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: { industryProfile: { select: { userId: true } } },
    });
    if (!challenge) return notFound("Challenge not found");

    // Industry SPOC can only see their own challenge's proposals
    if (isIndustry && challenge.industryProfile?.userId !== session.user.id) {
      return forbidden("Access denied to this challenge's proposals");
    }

    const skip = (page - 1) * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      challengeId: id,
      ...(status ? { status } : {}),
    };

    let requestingUserInstitutionId: string | undefined;
    if (isInstitutionSpoc) {
      const spocProfile = await prisma.institutionProfile.findUnique({
        where: { userId: session.user.id },
        select: { institutionId: true },
      });
      if (!spocProfile) {
        return ok({
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }
      where.institutionId = spocProfile.institutionId;
      requestingUserInstitutionId = spocProfile.institutionId;
    }

    const [total, proposals] = await Promise.all([
      prisma.proposal.count({ where }),
      prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          institution: { select: { name: true, city: true } },
        },
      }),
    ]);

    const serialized = proposals.map((p) =>
      serializeProposal(p, role, session.user.id, requestingUserInstitutionId)
    );

    return ok({
      data: serialized,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/challenges/[id]/proposals]", err);
    return serverError();
  }
}

/**
 * POST /api/challenges/[id]/proposals
 * Institution SPOC only — submit (or update a draft / revision of) their team's solution.
 * One active proposal per institution per challenge.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return unauthorized();
    if (session.user.role !== "INSTITUTION_SPOC") {
      return forbidden("Only institutions can submit solutions");
    }

    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) return notFound("Challenge not found");
    if (challenge.status !== "OPEN") {
      return badRequest("This challenge is not open for submissions");
    }
    if (new Date() > challenge.deadline) {
      return badRequest("The deadline for this challenge has passed");
    }

    const instProfile = await prisma.institutionProfile.findUnique({
      where: { userId: session.user.id },
      select: { institutionId: true },
    });
    if (!instProfile) {
      return badRequest("Institution profile not found — please complete registration");
    }
    const institutionId = instProfile.institutionId;

    const body = await req.json();
    const parsed = ProposalCreateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const { isDraft, ...fields } = parsed.data;
    const proposalFields = {
      title: fields.title || null,
      summary: fields.summary,
      detailedApproach: fields.detailedApproach || null,
      technologiesUsed: fields.technologiesUsed ?? [],
      demoUrl: fields.demoUrl || null,
      teamName: fields.teamName,
      teamLead: fields.teamLead,
      teamMembers: fields.teamMembers ?? [],
      facultyMentor: fields.facultyMentor ?? undefined,
    };

    // Check for an existing proposal from this institution (draft or revision request)
    const existing = await prisma.proposal.findFirst({
      where: { challengeId: id, institutionId },
      orderBy: { submittedAt: "desc" },
    });

    let proposal;
    let transitionAction: "PROPOSAL_SUBMITTED" | "PROPOSAL_STATUS_CHANGED" = "PROPOSAL_SUBMITTED";

    if (existing) {
      if (
        existing.status === "SUBMITTED" ||
        existing.status === "UNDER_REVIEW" ||
        existing.status === "RESUBMITTED" ||
        existing.status === "APPROVED" ||
        existing.status === "REJECTED"
      ) {
        return conflict(`Your institution has already submitted a solution for this challenge (current status: ${existing.status})`);
      }

      let nextStatus: ProposalStatus = existing.status;
      if (!isDraft) {
        if (existing.status === "DRAFT") {
          nextStatus = "SUBMITTED";
        } else if (existing.status === "REVISION_REQUESTED") {
          nextStatus = "RESUBMITTED";
        }
      }

      proposal = await prisma.proposal.update({
        where: { id: existing.id },
        data: {
          ...proposalFields,
          approachDoc: fields.approachDoc ?? existing.approachDoc,
          submittedById: session.user.id,
          status: nextStatus,
        },
      });
      transitionAction = "PROPOSAL_STATUS_CHANGED";
    } else {
      const initialStatus = isDraft ? "DRAFT" : "SUBMITTED";
      proposal = await prisma.proposal.create({
        data: {
          ...proposalFields,
          challengeId: id,
          institutionId,
          submittedById: session.user.id,
          approachDoc: fields.approachDoc,
          status: initialStatus,
        },
      });
    }

    // Only notify industry if proposal is submitted/resubmitted
    // (Problems from unregistered organisations have no account to notify — CII follows up.)
    if (
      challenge.industryProfileId &&
      (proposal.status === "SUBMITTED" || proposal.status === "RESUBMITTED")
    ) {
      const industryProfile = await prisma.industryProfile.findUnique({
        where: { id: challenge.industryProfileId },
        select: { userId: true },
      });

      if (industryProfile) {
        await prisma.notification.create({
          data: {
            userId: industryProfile.userId,
            title: proposal.status === "RESUBMITTED" ? "Proposal Resubmitted" : "New Proposal Received",
            body: proposal.status === "RESUBMITTED"
              ? `A proposal has been resubmitted for your challenge: "${challenge.title}"`
              : `A new proposal has been submitted for your challenge: "${challenge.title}"`,
            link: `/api/challenges/${id}/proposals/${proposal.id}`,
          },
        });
      }
    }

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: transitionAction,
      entityType: "Proposal",
      entityId: proposal.id,
      oldValue: existing ? { status: existing.status } : undefined,
      newValue: { challengeId: id, status: proposal.status },
      ipAddress,
      userAgent,
    });

    // Return the same shape as the proposal list so the frontend can use it directly
    const full = await prisma.proposal.findUnique({
      where: { id: proposal.id },
      include: {
        institution: { select: { name: true, city: true } },
        challenge: {
          select: {
            title: true,
            domain: true,
            organizationName: true,
            industryProfile: { select: { companyName: true } },
          },
        },
      },
    });
    return created(serializeProposal(full ?? proposal, session.user.role, session.user.id, institutionId));
  } catch (err) {
    console.error("[POST /api/challenges/[id]/proposals]", err);
    return serverError();
  }
}
