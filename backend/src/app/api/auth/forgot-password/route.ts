import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import {
  ok,
  serverError,
  tooManyRequests,
  validationError,
} from "@/lib/api-response";
import { sendPasswordResetEmail } from "@/lib/email";
import { getRequestMeta } from "@/lib/audit";
import { isRateLimited } from "@/lib/rate-limit";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const RESET_TOKEN_TTL_MINUTES = 60; // 1 hour

/**
 * POST /api/auth/forgot-password
 * Public — generates a password reset token.
 *
 * The reset link is only ever sent by email (printed in the server terminal while
 * SMTP is not configured) — never returned in the response.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const { email } = parsed.data;
    const genericResponse = ok({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });

    // Stop inbox flooding: per network (visible) and per address (silent, so it
    // doesn't reveal whether the address is registered)
    const { ipAddress } = getRequestMeta(req);
    if (isRateLimited(`forgot-password:ip:${ipAddress}`, 10, 60 * 60 * 1000)) {
      return tooManyRequests("Too many password reset requests. Please try again in an hour.");
    }
    if (isRateLimited(`forgot-password:email:${email.toLowerCase()}`, 3, 60 * 60 * 1000)) {
      return genericResponse;
    }

    // Always return 200 to avoid leaking which emails are registered
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      // Return success regardless to prevent email enumeration
      return ok({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Invalidate all previous unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Link to the website's "set a new password" page
    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      console.error("[ForgotPassword] Failed to send email, proceeding anyway:", err);
    }

    return genericResponse;
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return serverError();
  }
}
