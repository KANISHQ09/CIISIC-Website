import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { INDUSTRY_PROFILE_SELECT } from "@/lib/problem-submission";
import { serializeChallenge } from "@/lib/serializers";
import { storageProvider } from "@/lib/storage";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api-response";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_MAGIC = "%PDF-";
const CHALLENGE_INCLUDE = {
  industryProfile: { select: INDUSTRY_PROFILE_SELECT },
  _count: { select: { proposals: true } },
} as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: unauthorized() };
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "CII_ADMIN") {
    return { error: forbidden("Only CII administrators can manage standardised files") };
  }
  return { session };
}

/**
 * POST /api/admin/challenges/[id]/standardised-file
 * CII admin uploads a standardised PDF of the industry's raw file (CII portal review, 16 Nov 2026).
 * Institutions and visitors then receive this version instead of the raw file.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { id: true, standardisedFileUrl: true },
    });
    if (!challenge) return notFound("Challenge not found");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file uploaded");
    if (file.size > MAX_SIZE) return badRequest("The file exceeds the 10MB limit");
    if (file.type !== "application/pdf") return badRequest("The standardised file must be a PDF");

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
      return badRequest("The standardised file must be a PDF");
    }

    const { url: storedUrl } = await storageProvider.uploadFile(buffer, file.name, "application/pdf", "DOCUMENT");
    const url = storedUrl.startsWith("/") ? new URL(storedUrl, req.nextUrl.origin).toString() : storedUrl;

    const updated = await prisma.challenge.update({
      where: { id },
      data: { standardisedFileUrl: url, standardisedAt: new Date() },
      include: CHALLENGE_INCLUDE,
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: "CHALLENGE_UPDATED",
      entityType: "Challenge",
      entityId: id,
      oldValue: { standardisedFileUrl: challenge.standardisedFileUrl },
      newValue: { standardisedFileUrl: url },
      ipAddress,
      userAgent,
    });

    return ok(serializeChallenge(updated, session.user.role));
  } catch (err) {
    console.error("[POST /api/admin/challenges/[id]/standardised-file]", err);
    return serverError();
  }
}

/** DELETE — stop using the standardised file, so viewers receive the industry's original again. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { id: true, standardisedFileUrl: true },
    });
    if (!challenge) return notFound("Challenge not found");

    const updated = await prisma.challenge.update({
      where: { id },
      data: { standardisedFileUrl: null, standardisedAt: null },
      include: CHALLENGE_INCLUDE,
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await createAuditLog({
      userId: session.user.id,
      action: "CHALLENGE_UPDATED",
      entityType: "Challenge",
      entityId: id,
      oldValue: { standardisedFileUrl: challenge.standardisedFileUrl },
      newValue: { standardisedFileUrl: null },
      ipAddress,
      userAgent,
    });

    return ok(serializeChallenge(updated, session.user.role));
  } catch (err) {
    console.error("[DELETE /api/admin/challenges/[id]/standardised-file]", err);
    return serverError();
  }
}
