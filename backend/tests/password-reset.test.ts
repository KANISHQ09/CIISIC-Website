import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as forgotPassword } from "../src/app/api/auth/forgot-password/route";
import { prisma } from "../src/lib/prisma";
import { sendPasswordResetEmail } from "../src/lib/email";

vi.mock("../src/lib/email", () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue({}) }));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn(), create: vi.fn() },
  },
}));

let ipCounter = 0;
function forgotRequest(email: string, ip?: string) {
  ipCounter++;
  return new NextRequest("http://ciisic.test/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip ?? `10.1.0.${ipCounter}` },
    body: JSON.stringify({ email }),
  });
}

describe("Forgot password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FRONTEND_URL", "https://ciisic.example/");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "spoc@jlu.edu.in",
      name: "Priya",
      isActive: true,
    } as any);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("emails a link to the website's reset page", async () => {
    const res = await forgotPassword(forgotRequest("spoc@jlu.edu.in"));
    expect(res.status).toBe(200);

    const token = (vi.mocked(prisma.passwordResetToken.create).mock.calls[0][0] as any).data.token;
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "spoc@jlu.edu.in",
      "Priya",
      `https://ciisic.example/reset-password?token=${token}`
    );
  });

  it("gives the same answer for unknown emails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await forgotPassword(forgotRequest("nobody@nowhere.in"));
    expect(res.status).toBe(200);
    expect((await res.json()).data.message).toMatch(/If an account with that email exists/);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("silently stops emailing the same address after 3 requests an hour", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await forgotPassword(forgotRequest("flood@acme.in"));
      expect(res.status).toBe(200);
    }
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3);
  });

  it("limits requests from one network", async () => {
    let last = 200;
    for (let i = 0; i < 11; i++) {
      last = (await forgotPassword(forgotRequest(`user${i}@acme.in`, "10.9.9.9"))).status;
    }
    expect(last).toBe(429);
  });
});
