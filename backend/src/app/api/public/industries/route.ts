import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-response";

/**
 * GET /api/public/industries
 * Public — the organisation dropdown on the "Submit a problem" form.
 * Lists only approved, active industry accounts, and only non-sensitive fields.
 */
export async function GET() {
  try {
    const profiles = await prisma.industryProfile.findMany({
      where: { user: { role: "INDUSTRY_SPOC", isActive: true, approvalStatus: "APPROVED" } },
      select: { id: true, companyName: true, industry: true, logoUrl: true, websiteUrl: true },
      orderBy: { companyName: "asc" },
    });

    return ok(profiles);
  } catch (err) {
    console.error("[GET /api/public/industries]", err);
    return serverError();
  }
}
