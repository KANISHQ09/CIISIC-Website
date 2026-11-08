import { describe, it, expect, afterEach, vi } from "vitest";
import { generateToken, verifyToken } from "../src/lib/auth";

const payload = { id: "u1", email: "admin@ciisic.in", role: "CII_ADMIN" as const, name: "CII Admin" };
const STRONG_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";

describe("Login tokens", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("verifies a token it issued", async () => {
    vi.stubEnv("JWT_SECRET", STRONG_SECRET);
    const token = await generateToken(payload);
    const verified = await verifyToken(token);
    expect(verified?.id).toBe("u1");
    expect(verified?.role).toBe("CII_ADMIN");
  });

  it("rejects a token whose contents were changed", async () => {
    vi.stubEnv("JWT_SECRET", STRONG_SECRET);
    const [header, , signature] = (await generateToken(payload)).split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ ...payload, role: "SUPER_ADMIN", exp: 9999999999 }))
      .toString("base64url");
    expect(await verifyToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    vi.stubEnv("JWT_SECRET", STRONG_SECRET);
    const token = await generateToken(payload);
    vi.stubEnv("JWT_SECRET", "a-completely-different-secret-of-sufficient-length");
    expect(await verifyToken(token)).toBeNull();
  });

  it("refuses to work in production without a real secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "");
    await expect(generateToken(payload)).rejects.toThrow(/JWT_SECRET/);

    // A token made with the public fallback secret must not be accepted either
    vi.stubEnv("NODE_ENV", "development");
    const fallbackToken = await generateToken(payload);
    vi.stubEnv("NODE_ENV", "production");
    expect(await verifyToken(fallbackToken)).toBeNull();
  });
});
