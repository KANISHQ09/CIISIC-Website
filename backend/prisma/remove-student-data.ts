/**
 * One-off clean-up for retiring student accounts (Phase 4).
 *
 * Run this BEFORE `npm run db:push` on the Phase 4 schema: the database cannot drop the
 * STUDENT role or the StudentProfile table while rows still use them.
 *
 * It uses raw SQL, so it works whether or not the Prisma client still knows about students.
 *
 *   npm run db:remove-student-data             (dry run — only prints what it would do)
 *   npm run db:remove-student-data -- --apply  (makes the changes, in one transaction)
 *
 * What --apply does:
 *   1. Copies the institution from any remaining student-linked solution onto the solution itself
 *      (same as the Phase 2 backfill), so no solution loses its institution.
 *   2. Unlinks every solution from student profiles.
 *   3. Permanently deletes student user accounts and what belongs only to them:
 *      their messages, notifications and audit-log entries, and (by cascade) their
 *      student profiles, sessions and password-reset tokens.
 * Take a database backup first if you may need any of that data later.
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

type CountRow = { count: bigint };

async function count(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return Number(rows[0]?.count ?? 0);
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS "exists"`,
    name
  );
  return !!rows[0]?.exists;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2) AS "exists"`,
    table,
    column
  );
  return !!rows[0]?.exists;
}

async function main() {
  const hasStudentTable = await tableExists("StudentProfile");
  const hasStudentColumn = await columnExists("Proposal", "studentProfileId");

  const studentUsers = await count(`SELECT COUNT(*)::bigint AS count FROM "User" WHERE "role"::text = 'STUDENT'`);
  const studentProfiles = hasStudentTable
    ? await count(`SELECT COUNT(*)::bigint AS count FROM "StudentProfile"`)
    : 0;
  const linkedProposals = hasStudentColumn
    ? await count(`SELECT COUNT(*)::bigint AS count FROM "Proposal" WHERE "studentProfileId" IS NOT NULL`)
    : 0;
  const proposalsNeedingInstitution = hasStudentColumn
    ? await count(`SELECT COUNT(*)::bigint AS count FROM "Proposal" WHERE "studentProfileId" IS NOT NULL AND "institutionId" IS NULL`)
    : 0;
  const studentMessages = await count(
    `SELECT COUNT(*)::bigint AS count FROM "Message" m JOIN "User" u ON u.id = m."senderId" WHERE u."role"::text = 'STUDENT'`
  );
  const studentNotifications = await count(
    `SELECT COUNT(*)::bigint AS count FROM "Notification" n JOIN "User" u ON u.id = n."userId" WHERE u."role"::text = 'STUDENT'`
  );
  const studentAuditLogs = await count(
    `SELECT COUNT(*)::bigint AS count FROM "AuditLog" a JOIN "User" u ON u.id = a."userId" WHERE u."role"::text = 'STUDENT'`
  );

  console.log("Student data still in the database:");
  console.log(`  Student user accounts:            ${studentUsers}`);
  console.log(`  Student profiles:                 ${studentProfiles}`);
  console.log(`  Solutions linked to a student:    ${linkedProposals} (${proposalsNeedingInstitution} still need their institution copied)`);
  console.log(`  Messages sent by students:        ${studentMessages}`);
  console.log(`  Notifications for students:       ${studentNotifications}`);
  console.log(`  Audit-log entries by students:    ${studentAuditLogs}`);

  const nothingToDo = studentUsers + studentProfiles + linkedProposals === 0;
  if (nothingToDo) {
    console.log("\nNothing to clean up. You can run `npm run db:push` now.");
    return;
  }

  if (!apply) {
    console.log("\nDry run only — nothing was changed. Re-run with --apply to clean up, then run `npm run db:push`.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (hasStudentColumn && hasStudentTable) {
      await tx.$executeRawUnsafe(`
        UPDATE "Proposal" p
           SET "institutionId" = sp."institutionId"
          FROM "StudentProfile" sp
         WHERE p."studentProfileId" = sp.id
           AND p."institutionId" IS NULL`);
      await tx.$executeRawUnsafe(`UPDATE "Proposal" SET "studentProfileId" = NULL WHERE "studentProfileId" IS NOT NULL`);
    }

    const studentFilter = `(SELECT id FROM "User" WHERE "role"::text = 'STUDENT')`;
    await tx.$executeRawUnsafe(`DELETE FROM "Message" WHERE "senderId" IN ${studentFilter}`);
    await tx.$executeRawUnsafe(`DELETE FROM "Notification" WHERE "userId" IN ${studentFilter}`);
    await tx.$executeRawUnsafe(`DELETE FROM "AuditLog" WHERE "userId" IN ${studentFilter}`);
    if (hasStudentTable) {
      await tx.$executeRawUnsafe(`DELETE FROM "StudentProfile"`);
    }
    // Sessions, accounts and password-reset tokens cascade with the user
    await tx.$executeRawUnsafe(`DELETE FROM "User" WHERE "role"::text = 'STUDENT'`);
  });

  console.log("\nClean-up complete. Now run `npm run db:push` to drop the student table and role.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
