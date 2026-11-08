import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { RegisterSchema } from "@/lib/validations/auth";
import { createAuditLog } from "@/lib/audit";
import {
  badRequest,
  conflict,
  created,
  serverError,
  validationError,
} from "@/lib/api-response";

/**
 * POST /api/auth/register
 * Creates a new user with role-specific profile in a single transaction.
 *
 * Body: { email, password, name, role, ...roleSpecificFields }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.flatten());
    }

    const data = parsed.data;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return conflict("An account with this email is already registered. Please sign in.");
    }

    const passwordHash = await hashPassword(data.password);

    if (data.role === "INDUSTRY_SPOC" && !data.companyName) {
      return badRequest("Industry users must provide company name");
    }

    if (data.role === "INSTITUTION_SPOC" && !data.spocInstitutionId) {
      return badRequest("Institution SPOCs must provide their institution ID");
    }

    // Every self-registered partner account waits for CII Administrator approval
    const requiresApproval = true;

    // Create user + profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          passwordHash,
          isActive: !requiresApproval,
          approvalStatus: requiresApproval ? "PENDING" : "APPROVED",
        },
      });

      if (data.role === "INDUSTRY_SPOC") {
        await tx.industryProfile.create({
          data: {
            userId: newUser.id,
            companyName: data.companyName!,
            industry: data.industry ?? "General",
            websiteUrl: data.websiteUrl || null,
            isCIIMember: data.isCIIMember ?? false,
            phone: data.phone || null,
            designation: data.designation || null,
          },
        });
      } else if (data.role === "INSTITUTION_SPOC") {
        let instId = data.spocInstitutionId || "Partner Institution";
        const found = await tx.institution.findFirst({
          where: {
            OR: [
              { id: instId },
              { name: { equals: instId, mode: "insensitive" } },
            ],
          },
        });

        if (found) {
          instId = found.id;
        } else {
          const createdInst = await tx.institution.create({
            data: {
              name: instId,
              city: data.institutionCity || "Madhya Pradesh",
            },
          });
          instId = createdInst.id;
        }

        await tx.institutionProfile.create({
          data: {
            userId: newUser.id,
            institutionId: instId,
            designation: data.designation ?? "CII SPOC",
            department: data.department ?? "Engineering",
            phone: data.phone || null,
          },
        });
      }

      return newUser;
    });

    await createAuditLog({
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
      ipAddress:
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return created({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      approvalStatus: user.approvalStatus,
      requiresApproval,
    });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return serverError();
  }
}
