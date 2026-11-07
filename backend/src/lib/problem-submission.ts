import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/** Fields of the owning industry account that challenge responses need (incl. the review hint). */
export const INDUSTRY_PROFILE_SELECT = {
  id: true,
  userId: true,
  companyName: true,
  industry: true,
  logoUrl: true,
  websiteUrl: true,
  isCIIMember: true,
  user: { select: { email: true, name: true } },
} as const;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid misreading

/** Generate a unique, human-friendly reference like CII-2026-4F7K2Q. */
export async function generateReferenceCode(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    const code = `CII-${year}-${suffix}`;
    const taken = await db.challenge.findUnique({ where: { referenceCode: code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Could not generate a unique reference code");
}

/** Lower-cased domain of an email or website, without "www.". */
export function domainOf(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v.includes("@")) return v.split("@").pop() || null;
  try {
    const url = new URL(v.startsWith("http") ? v : `https://${v}`);
    return url.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com",
  "live.com", "icloud.com", "rediffmail.com", "protonmail.com", "aol.com",
]);

/**
 * Hint for CII reviewers: does the submitter's email belong to the selected
 * registered company? true = same domain as the account email or company website,
 * false = different (or a free webmail address), null = nothing to compare.
 */
export function emailMatchesCompany(
  contactEmail: string | null | undefined,
  accountEmail: string | null | undefined,
  companyWebsite: string | null | undefined
): boolean | null {
  const contact = domainOf(contactEmail);
  if (!contact) return null;
  const known = [domainOf(accountEmail), domainOf(companyWebsite)].filter(
    (d): d is string => !!d && !FREE_EMAIL_DOMAINS.has(d)
  );
  if (known.length === 0) return null;
  return known.some((d) => contact === d || contact.endsWith(`.${d}`));
}
