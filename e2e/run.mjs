/**
 * End-to-end test runner.
 *
 *   cd e2e
 *   npm install          (first time only)
 *   npm test             run everything, then shut down
 *   npm test -- --keep   leave the test backend + database running for manual checks
 *
 * What it does:
 *   1. Starts a throwaway PostgreSQL (embedded-postgres) in e2e/.pgdata — never your Supabase DB.
 *   2. Loads the Prisma schema and the seed data into it.
 *   3. Builds and starts the backend on http://localhost:3997, pointed at that database
 *      (its build goes to backend/.next-e2e, so a running dev server is not affected).
 *   4. Runs flows.test.mjs against it.
 *   5. Stops everything and deletes the database files.
 */
import EmbeddedPostgres from "embedded-postgres";
import { spawn, execSync } from "node:child_process";
import { mkdirSync, rmSync, createWriteStream, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(HERE, "../backend");
const OUTPUT = path.join(HERE, ".output");
const PG_DIR = path.join(HERE, ".pgdata");
const PG_PORT = 54329;
const API_PORT = 3997;
const KEEP = process.argv.includes("--keep");

const DB_URL = `postgresql://postgres:postgres@localhost:${PG_PORT}/ciisic_e2e`;

// Test-only settings. Set explicitly so nothing from backend/.env (live DB, Supabase storage,
// SMTP) is used: existing environment variables are never overridden by .env files.
export const TEST_ENV = {
  DATABASE_URL: DB_URL,
  DIRECT_URL: DB_URL,
  JWT_SECRET: "e2e-only-secret-not-used-anywhere-else-0123456789",
  CRON_SECRET: "e2e-cron-secret",
  FRONTEND_URL: "http://localhost:3000",
  ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
  SUPABASE_URL: "",
  SMTP_HOST: "",
  SMTP_USER: "",
  SMTP_PASS: "",
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_TELEMETRY_DISABLED: "1",
  // Unsent emails are written here so the tests can read them (see backend/src/lib/email.ts)
  EMAIL_OUTBOX_FILE: path.join(path.dirname(fileURLToPath(import.meta.url)), ".output", "outbox.jsonl"),
  SEED_SUPER_ADMIN_PASSWORD: "E2E-SuperAdmin-Pass-2026",
  SEED_CII_ADMIN_PASSWORD: "E2E-CiiAdmin-Pass-2026",
};

const env = { ...process.env, ...TEST_ENV };
const children = [];

function log(step) {
  console.log(`\n▶ ${step}`);
}

function run(command, cwd, extraEnv = {}) {
  execSync(command, { cwd, env: { ...env, ...extraEnv }, stdio: "inherit" });
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  } catch {
    /* already gone */
  }
}

async function waitForHealth(url, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Backend did not become healthy at ${url}`);
}

async function main() {
  rmSync(PG_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT, { recursive: true });
  rmSync(TEST_ENV.EMAIL_OUTBOX_FILE, { force: true });

  log(`Starting throwaway PostgreSQL on port ${PG_PORT}`);
  const pg = new EmbeddedPostgres({
    databaseDir: PG_DIR,
    user: "postgres",
    password: "postgres",
    port: PG_PORT,
    persistent: false,
    // Match Supabase: UTF-8 text (Windows would otherwise default to WIN1252 and reject e.g. "₹")
    initdbFlags: ["--encoding=UTF8", "--no-locale"],
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("ciisic_e2e");

  let exitCode = 1;
  let backend;
  try {
    log("Creating tables (prisma db push)");
    run("npx prisma db push --skip-generate", BACKEND);

    log("Loading seed data");
    run("npx prisma db seed", BACKEND);

    log("Building the backend (into backend/.next-e2e)");
    run("npx next build", BACKEND);

    log(`Starting the backend on http://localhost:${API_PORT}`);
    const logFile = path.join(OUTPUT, "backend.log");
    const logStream = createWriteStream(logFile);
    // Run Next.js directly with Node (not through npx/a shell) so its output reaches the
    // log immediately — the tests read emails from it.
    const nextBin = path.join(BACKEND, "node_modules", "next", "dist", "bin", "next");
    backend = spawn(process.execPath, [nextBin, "start", "-p", String(API_PORT)], {
      cwd: BACKEND,
      env: { ...env, NODE_ENV: "production" },
      detached: process.platform !== "win32",
    });
    children.push(backend);
    backend.stdout.pipe(logStream);
    backend.stderr.pipe(logStream);
    await waitForHealth(`http://localhost:${API_PORT}/api/health`);

    log("Running end-to-end flows");
    try {
      run("node --test --test-reporter=spec flows.test.mjs", HERE, {
        E2E_API: `http://localhost:${API_PORT}`,
        E2E_BACKEND_LOG: logFile,
        E2E_OUTBOX: TEST_ENV.EMAIL_OUTBOX_FILE,
      });
      exitCode = 0;
    } catch {
      exitCode = 1;
    }

    if (KEEP) {
      console.log(`
✔ Test stack is running:
    Backend API : http://localhost:${API_PORT}
    Database    : ${DB_URL}
  Point the frontend at it:  set VITE_API_URL=http://localhost:${API_PORT} before "npm run dev"
  Logins: see e2e/CHECKLIST.md. Press Ctrl+C to stop and delete the test database.`);
      // Stop on Ctrl+C, or when e2e/.output/stop is created (handy when run in the background)
      const stopFile = path.join(OUTPUT, "stop");
      rmSync(stopFile, { force: true });
      await new Promise((resolve) => {
        process.once("SIGINT", resolve);
        const timer = setInterval(() => {
          if (existsSync(stopFile)) {
            clearInterval(timer);
            rmSync(stopFile, { force: true });
            resolve();
          }
        }, 1000);
      });
    }
  } finally {
    log("Shutting down");
    killTree(backend);
    await pg.stop().catch(() => {});
    rmSync(PG_DIR, { recursive: true, force: true });
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => {
  if (!KEEP) {
    children.forEach(killTree);
    process.exit(130);
  }
});

main().catch((err) => {
  console.error(err);
  children.forEach(killTree);
  process.exit(1);
});
