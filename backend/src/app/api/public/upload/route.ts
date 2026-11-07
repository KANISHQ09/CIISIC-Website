import { NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/audit";
import { isRateLimited } from "@/lib/rate-limit";
import { storageProvider } from "@/lib/storage";
import { badRequest, created, serverError, tooManyRequests } from "@/lib/api-response";

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
const PDF_MAGIC = "%PDF-";

/**
 * POST /api/public/upload
 * Public — attach a PDF to a problem statement submitted without logging in.
 * PDF only, 10MB max, rate-limited per network.
 */
export async function POST(req: NextRequest) {
  try {
    const { ipAddress } = getRequestMeta(req);
    if (isRateLimited(`public-upload:${ipAddress}`, 10, 60 * 60 * 1000)) {
      return tooManyRequests("Too many uploads from this network. Please try again in an hour.");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file uploaded");
    if (file.size > MAX_DOC_SIZE) return badRequest("Document file size exceeds the 10MB limit");
    if (file.type !== "application/pdf") return badRequest("Invalid document format. Allowed: PDF");

    const buffer = Buffer.from(await file.arrayBuffer());
    // Check the file really is a PDF, not just labelled as one
    if (buffer.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
      return badRequest("Invalid document format. Allowed: PDF");
    }

    const { url: relativeUrl, path, bucket } = await storageProvider.uploadFile(
      buffer,
      file.name,
      "application/pdf",
      "DOCUMENT"
    );

    const absoluteUrl = relativeUrl.startsWith("/")
      ? new URL(relativeUrl, req.nextUrl.origin).toString()
      : relativeUrl;

    return created({ url: absoluteUrl, path, bucket, size: file.size, fileName: file.name });
  } catch (err) {
    console.error("[POST /api/public/upload]", err);
    return serverError();
  }
}
