import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { serializeChallenge } from "../src/lib/serializers";
import { DELETE, POST } from "../src/app/api/admin/challenges/[id]/standardised-file/route";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import { storageProvider } from "../src/lib/storage";

vi.mock("../src/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("../src/lib/storage", () => ({ storageProvider: { uploadFile: vi.fn() } }));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    challenge: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

const RAW = "https://files.example/raw-notes.pdf";
const CLEAN = "https://files.example/standardised.pdf";
const problem = {
  id: "c1",
  status: "OPEN",
  industryProfileId: "company-1",
  attachmentUrls: [RAW],
  standardisedFileUrl: CLEAN,
  standardisedAt: new Date("2026-11-20"),
};

describe("Who receives the raw file and the standardised file", () => {
  it("institutions, visitors and other companies get only the standardised file", () => {
    for (const out of [
      serializeChallenge(problem),
      serializeChallenge(problem, "INSTITUTION_SPOC", "spoc-1"),
      serializeChallenge(problem, "INDUSTRY_SPOC", "company-2"),
    ]) {
      expect(out.attachmentUrls).toEqual([CLEAN]);
      expect(JSON.stringify(out)).not.toContain(RAW);
    }
  });

  it("CII admins and the owning company keep the original too", () => {
    for (const out of [
      serializeChallenge(problem, "CII_ADMIN"),
      serializeChallenge(problem, "INDUSTRY_SPOC", "company-1"),
    ]) {
      expect(out.attachmentUrls).toEqual([RAW]);
      expect(out.standardisedFile?.url).toBe(CLEAN);
    }
  });

  it("everyone gets the original while no standardised file exists", () => {
    const out = serializeChallenge({ ...problem, standardisedFileUrl: null, standardisedAt: null });
    expect(out.attachmentUrls).toEqual([RAW]);
    expect(out.standardisedFile).toBeNull();
  });
});

describe("Managing the standardised file", () => {
  const url = "http://ciisic.test/api/admin/challenges/c1/standardised-file";
  const context = { params: Promise.resolve({ id: "c1" }) };
  const upload = (content: string, type = "application/pdf") => {
    const form = new FormData();
    form.append("file", new File([content], "clean.pdf", { type }));
    return new NextRequest(url, { method: "POST", body: form });
  };
  const signInAs = (role: string) =>
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1", role, email: "u@x.in", name: "U", avatarUrl: null } } as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.challenge.findUnique).mockResolvedValue({ id: "c1", standardisedFileUrl: null } as never);
    vi.mocked(prisma.challenge.update).mockResolvedValue(problem as never);
    vi.mocked(storageProvider.uploadFile).mockResolvedValue({ url: CLEAN, secureName: "s", path: "p", bucket: "b" });
  });

  it("only CII admins can upload or remove it", async () => {
    for (const role of ["INDUSTRY_SPOC", "INSTITUTION_SPOC"]) {
      signInAs(role);
      expect((await POST(upload("%PDF-1.7"), context)).status).toBe(403);
      expect((await DELETE(new NextRequest(url, { method: "DELETE" }), context)).status).toBe(403);
    }
    vi.mocked(auth).mockResolvedValue(null);
    expect((await POST(upload("%PDF-1.7"), context)).status).toBe(401);
    expect(prisma.challenge.update).not.toHaveBeenCalled();
  });

  it("refuses a file that is not really a PDF", async () => {
    signInAs("CII_ADMIN");
    expect((await POST(upload("<html>not a pdf</html>"), context)).status).toBe(400);
    expect((await POST(upload("%PDF-1.7", "text/plain"), context)).status).toBe(400);
    expect(storageProvider.uploadFile).not.toHaveBeenCalled();
  });

  it("saves a valid PDF and records it", async () => {
    signInAs("CII_ADMIN");
    expect((await POST(upload("%PDF-1.7 content"), context)).status).toBe(200);
    const args = vi.mocked(prisma.challenge.update).mock.calls[0][0];
    expect(args.data.standardisedFileUrl).toBe(CLEAN);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("can be removed", async () => {
    signInAs("CII_ADMIN");
    expect((await DELETE(new NextRequest(url, { method: "DELETE" }), context)).status).toBe(200);
    expect(vi.mocked(prisma.challenge.update).mock.calls[0][0].data.standardisedFileUrl).toBeNull();
  });
});
