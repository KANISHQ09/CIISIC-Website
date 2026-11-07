/**
 * One-off data backfill for the student-portal removal (Phase 2).
 *
 * Copies each legacy proposal's institution from its StudentProfile onto the new
 * Proposal.institutionId column, and records the submitter where it can be known.
 * Safe to run more than once: it only touches proposals whose institutionId is still empty.
 *
 * Run AFTER `npm run db:push` has added the new columns:
 *   npm run db:backfill-proposals            (dry run — prints what would change)
 *   npm run db:backfill-proposals -- --apply (writes the changes)
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const pending = await prisma.proposal.findMany({
    where: { institutionId: null },
    include: {
      studentProfile: {
        select: {
          institutionId: true,
          userId: true,
          department: true,
          yearOfStudy: true,
          user: { select: { name: true, email: true, role: true } },
        },
      },
    },
  });

  console.log(`Found ${pending.length} proposal(s) without an institution.`);

  let updated = 0;
  let skipped = 0;

  for (const p of pending) {
    if (!p.studentProfile) {
      console.warn(`  ! ${p.id}: no student profile to copy from — skipped`);
      skipped++;
      continue;
    }

    const sp = p.studentProfile;
    // Institution SPOCs used to submit through a placeholder student profile,
    // so in that case the profile's user is the real submitter.
    const submittedById = sp.user?.role === "INSTITUTION_SPOC" ? sp.userId : null;
    const isRealStudent = sp.user?.role === "STUDENT";

    const data = {
      institutionId: sp.institutionId,
      submittedById,
      // Keep the original student's name on record as the team lead
      ...(isRealStudent && !p.teamLead
        ? {
            teamLead: {
              name: sp.user?.name ?? "",
              email: sp.user?.email ?? "",
              department: sp.department,
              yearOfStudy: String(sp.yearOfStudy),
            },
          }
        : {}),
    };

    console.log(`  ${apply ? "✓" : "·"} ${p.id} → institution ${sp.institutionId}`);
    if (apply) {
      await prisma.proposal.update({ where: { id: p.id }, data });
    }
    updated++;
  }

  console.log(
    `${apply ? "Updated" : "Would update"} ${updated}, skipped ${skipped}.` +
      (apply ? "" : " Re-run with --apply to write changes.")
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
