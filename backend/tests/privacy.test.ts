import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getInstitution } from "../src/app/api/institutions/[id]/route";
import { GET as listInstitutions } from "../src/app/api/institutions/route";
import { POST as login } from "../src/app/api/auth/login/route";
import { POST as forgotPassword } from "../src/app/api/auth/forgot-password/route";
import { GET as runDeadlineCron } from "../src/app/api/cron/deadline-notifications/route";
import { escapeHtml } from "../src/lib/email";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import { verifyPassword } from "../src/lib/password";

vi.mock("../src/lib/auth", () => ({
  auth: vi.fn(),
  generateToken: vi.fn().mockResolvedValue("signed-token"),
}));
vi.mock("../src/lib/password", () => ({ verifyPassword: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    institution: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn(), create: vi.fn() },
    challenge: { findMany: vi.fn().mockResolvedValue([]) },
    auditLog: { create: vi.fn().mockReturnValue({ catch: vi.fn() }) },
  },
}));

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Institution endpoints hide contact details from the public", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.institution.findUnique).mockResolvedValue({ id: "inst-1", name: "JLU" } as any);
  });

  it("does not load the contact person for a visitor", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await getInstitution(new NextRequest("http://ciisic.test/api/institutions/inst-1"), params("inst-1"));
    expect(res.status).toBe(200);

    const args = vi.mocked(prisma.institution.findUnique).mock.calls[0][0] as any;
    expect(args.include).toBeUndefined();
    expect(args.select.institutionProfile).toBeUndefined();
    expect(args.select.spocUserId).toBeUndefined();
  });

  it("does not load the contact person for a non-admin user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role: "INDUSTRY_SPOC" } } as any);
    await getInstitution(new NextRequest("http://ciisic.test/api/institutions/inst-1"), params("inst-1"));
    const args = vi.mocked(prisma.institution.findUnique).mock.calls[0][0] as any;
    expect(args.select?.institutionProfile).toBeUndefined();
  });

  it("includes the contact person for CII admins", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "a1", role: "CII_ADMIN" } } as any);
    await getInstitution(new NextRequest("http://ciisic.test/api/institutions/inst-1"), params("inst-1"));
    const args = vi.mocked(prisma.institution.findUnique).mock.calls[0][0] as any;
    expect(args.include.institutionProfile.include.user.select.email).toBe(true);
  });

  it("lists institutions with public fields only", async () => {
    vi.mocked(prisma.institution.count).mockResolvedValue(0);
    vi.mocked(prisma.institution.findMany).mockResolvedValue([]);
    await listInstitutions(new NextRequest("http://ciisic.test/api/institutions"));
    const args = vi.mocked(prisma.institution.findMany).mock.calls[0][0] as any;
    expect(args.select.spocUserId).toBeUndefined();
    expect(args.select.institutionProfile).toBeUndefined();
    expect(args.select.name).toBe(true);
  });
});

describe("Login does not reveal which emails are registered", () => {
  const pendingUser = {
    id: "u1",
    email: "pending@acme.in",
    name: "Pending User",
    role: "INDUSTRY_SPOC",
    approvalStatus: "PENDING",
    isActive: false,
    passwordHash: "hash",
  };

  const loginRequest = (password: string) =>
    new NextRequest("http://ciisic.test/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "pending@acme.in", password }),
    });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(pendingUser as any);
  });

  it("gives the generic error for a pending account when the password is wrong", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);
    const res = await login(loginRequest("wrong-password"));
    expect(res.status).toBe(401);
    expect((await res.json()).message).toBe("Invalid email or password");
  });

  it("explains the pending status only once the password is correct", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(true);
    const res = await login(loginRequest("Correct@123"));
    expect(res.status).toBe(403);
    expect((await res.json()).message).toMatch(/pending approval/i);
  });
});

describe("Forgot password never returns the reset token", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("omits the token even in development mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "admin@ciisic.in",
      name: "Admin",
      isActive: true,
    } as any);

    const res = await forgotPassword(
      new NextRequest("http://ciisic.test/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "admin@ciisic.in" }),
      })
    );
    const body = JSON.stringify(await res.json());
    const savedToken = (vi.mocked(prisma.passwordResetToken.create).mock.calls[0][0] as any).data.token;

    expect(res.status).toBe(200);
    expect(body).not.toContain(savedToken);
    expect(body).not.toContain("_dev_");
  });
});

describe("Deadline reminder job requires the cron secret", () => {
  afterEach(() => vi.unstubAllEnvs());

  const cronRequest = (authHeader?: string) =>
    new NextRequest("http://ciisic.test/api/cron/deadline-notifications", {
      headers: authHeader ? { authorization: authHeader } : {},
    });

  it("refuses to run when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await runDeadlineCron(cronRequest());
    expect(res.status).toBe(503);
  });

  it("rejects a missing or wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    expect((await runDeadlineCron(cronRequest())).status).toBe(401);
    expect((await runDeadlineCron(cronRequest("Bearer nope"))).status).toBe(401);
  });

  it("runs with the right secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    const res = await runDeadlineCron(cronRequest("Bearer s3cret-value"));
    expect(res.status).toBe(200);
  });
});

describe("Email text escaping", () => {
  it("neutralises HTML typed by users", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)"> & 'x'`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;x&#39;"
    );
  });
});
