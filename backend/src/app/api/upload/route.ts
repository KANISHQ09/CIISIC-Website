import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  badRequest,
  unauthorized,
  serverError,
  created,
} from "@/lib/api-response";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { storageProvider } from "@/lib/storage";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_ID_CARD_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const ALLOWED_ID_CARD_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf"];

/**
 * POST /api/upload
 * Secure file upload with strict validation:
 * - Logos/Images: Max 2MB, formats: JPEG, PNG, WebP
 * - Student ID Card: Max 5MB, formats: JPEG, PNG, WebP, PDF (available during registration)
 * - Documents: Max 10MB, formats: PDF
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = formData.get("type") as string | null; // "LOGO", "DOCUMENT", or "ID_CARD"

    if (!file) {
      return badRequest("No file uploaded");
    }

    if (!uploadType || (uploadType !== "LOGO" && uploadType !== "DOCUMENT" && uploadType !== "ID_CARD")) {
      return badRequest("Invalid upload type. Must be 'LOGO', 'DOCUMENT', or 'ID_CARD'");
    }

    // Require session for LOGO and DOCUMENT uploads. ID_CARD is used during student registration.
    const session = await auth();
    if (uploadType !== "ID_CARD" && !session?.user?.id) {
      return unauthorized();
    }

    // Validate size and mime type
    const size = file.size;
    const mimeType = file.type;

    if (uploadType === "LOGO") {
      if (size > MAX_LOGO_SIZE) {
        return badRequest("Logo file size exceeds the 2MB limit");
      }
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        return badRequest("Invalid logo format. Allowed: JPEG, JPG, PNG, WebP");
      }
    } else if (uploadType === "ID_CARD") {
      if (size > MAX_ID_CARD_SIZE) {
        return badRequest("ID Card file size exceeds the 5MB limit");
      }
      if (!ALLOWED_ID_CARD_TYPES.includes(mimeType)) {
        return badRequest("Invalid ID Card format. Allowed: JPEG, JPG, PNG, WebP, PDF");
      }
    } else {
      if (size > MAX_DOC_SIZE) {
        return badRequest("Document file size exceeds the 10MB limit");
      }
      if (!ALLOWED_DOC_TYPES.includes(mimeType)) {
        return badRequest("Invalid document format. Allowed: PDF");
      }
    }

    // Retrieve file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Delegate storage writing to storage provider
    const { url: relativeUrl, secureName, path, bucket } = await storageProvider.uploadFile(
      buffer,
      file.name,
      mimeType,
      uploadType
    );

    // Log the file upload in audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    if (session?.user?.id) {
      await createAuditLog({
        userId: session.user.id,
        action: "FILE_UPLOADED",
        entityType: "File",
        entityId: secureName,
        newValue: {
          fileName: file.name,
          type: uploadType,
          size,
          mimeType,
          url: relativeUrl,
        },
        ipAddress,
        userAgent,
      });
    }

    const absoluteUrl = relativeUrl.startsWith("/")
      ? new URL(relativeUrl, req.nextUrl.origin).toString()
      : relativeUrl;

    return created({
      url: absoluteUrl,
      path,
      bucket,
      size,
      mimeType,
      fileName: file.name,
      secureName,
    });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return serverError();
  }
}

