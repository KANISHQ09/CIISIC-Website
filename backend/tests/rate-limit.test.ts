import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { isRateLimited, countRecentHits, recordHit, clearHits } from "../src/lib/rate-limit";
import { POST as login } from "../src/app/api/auth/login/route";
import { prisma } from "../src/lib/prisma";
import { verifyPassword } from "../src/lib/password";

vi.mock("../src/lib/auth", () => ({ generateToken: vi.fn().mockResolvedValue("signed-token") }));
vi.mock("../src/lib/password", () => ({ verifyPassword: vi.fn() }));
vi.mock("../src/lib/prisma", async () => {
  const { fakeRateLimitHit } = await import("./helpers/fake-rate-limit");
  return {
    prisma: {
      user: { findUnique: vi.fn() },
      auditLog: { create: vi.fn().mockReturnValue({ catch: vi.fn() }) },
      rateLimitHit: fakeRateLimitHit(),
    },
  };
});

const store = () => (prisma as any).rateLimitHit;

describe("Database-backed limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store().reset();
  });

  it("allows requests up to the limit, then refuses", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) results.push(await isRateLimited("test:key", 3, 60_000));
    expect(results).toEqual([false, false, false, true]);
  });

  it("only counts hits inside the time window", async () => {
    await store().create({ data: { key: "old", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } });
    await recordHit("old");
    expect(await countRecentHits("old", 60 * 60 * 1000)).toBe(1);
  });

  it("keeps separate counts per key and can clear one key", async () => {
    await recordHit("a");
    await recordHit("b");
    await clearHits("a");
    expect(await countRecentHits("a", 60_000)).toBe(0);
    expect(await countRecentHits("b", 60_000)).toBe(1);
  });

  it("lets requests through if the database is unavailable", async () => {
    store().count.mockRejectedValueOnce(new Error("db down"));
    expect(await isRateLimited("test:key", 1, 60_000)).toBe(false);
  });
});

describe("Failed sign-in limit", () => {
  const user = {
    id: "u1",
    email: "spoc@jlu.edu.in",
    name: "Priya",
    role: "INSTITUTION_SPOC",
    approvalStatus: "APPROVED",
    isActive: true,
    passwordHash: "hash",
    avatarUrl: null,
  };

  const attempt = (password: string, ip = "10.3.0.1", email = "spoc@jlu.edu.in") =>
    login(
      new NextRequest("http://ciisic.test/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify({ email, password }),
      })
    );

  beforeEach(() => {
    vi.clearAllMocks();
    store().reset();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(verifyPassword).mockImplementation(async (plain: string) => plain === "Correct@123");
  });

  it("pauses an account after 10 wrong passwords, even with the right one", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await attempt("wrong")).status).toBe(401);
    }
    const res = await attempt("Correct@123");
    expect(res.status).toBe(429);
    expect((await res.json()).message).toMatch(/Too many unsuccessful sign-in attempts/);
  });

  it("forgets earlier failures after a successful sign-in", async () => {
    for (let i = 0; i < 9; i++) await attempt("wrong");
    expect((await attempt("Correct@123")).status).toBe(200);
    expect((await attempt("wrong")).status).toBe(401); // counter restarted, not blocked
  });

  it("limits guessing across many accounts from one network", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    for (let i = 0; i < 30; i++) {
      await attempt("wrong", "10.3.0.99", `user${i}@acme.in`);
    }
    expect((await attempt("wrong", "10.3.0.99", "another@acme.in")).status).toBe(429);
  });
});
