import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();



async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

/** Random password that satisfies the platform's rules (upper-case letter + digit, 8+ chars). */
function generatePassword() {
  return `Ciisic-${randomBytes(9).toString("base64url")}-9A`;
}

/** Passwords for accounts created in this run, printed once at the end. */
const createdLogins: Array<{ label: string; email: string; password: string }> = [];

/**
 * Create a seed account only if it does not exist yet.
 * Existing accounts are never modified — in particular their passwords are never reset.
 */
async function ensureUser(opts: {
  label: string;
  email: string;
  name: string;
  role: Role;
  password: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing) {
    console.log(`↺ ${opts.label} already exists (${opts.email}) — left unchanged`);
    return existing;
  }
  const user = await prisma.user.create({
    data: {
      email: opts.email,
      name: opts.name,
      role: opts.role,
      passwordHash: await hash(opts.password),
      emailVerified: true,
      isActive: true,
    },
  });
  createdLogins.push({ label: opts.label, email: opts.email, password: opts.password });
  console.log(`✅ ${opts.label}: ${opts.email}`);
  return user;
}

/**
 * Admin passwords come from the environment; if unset, a random one is generated
 * (and printed once). Nothing secret is stored in this file.
 */
function adminPassword(envVar: string) {
  const fromEnv = process.env[envVar]?.trim();
  if (fromEnv) {
    if (fromEnv.length < 12) {
      throw new Error(`${envVar} must be at least 12 characters long`);
    }
    return fromEnv;
  }
  return generatePassword();
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Institutions ─────────────────────────────────────────────────────────
  const institutions = await Promise.all([
    prisma.institution.upsert({
      where: { name: "Jagran Lakecity University, Bhopal" },
      update: {},
      create: {
        name: "Jagran Lakecity University, Bhopal",
        city: "Bhopal",
        state: "Madhya Pradesh",
        cellTheme: "FAMILY_BUSINESS",
        websiteUrl: "https://jlu.edu.in",
      },
    }),
    prisma.institution.upsert({
      where: { name: "Lakshmi Narain College of Technology, Bhopal" },
      update: {},
      create: {
        name: "Lakshmi Narain College of Technology, Bhopal",
        city: "Bhopal",
        state: "Madhya Pradesh",
        cellTheme: "TALENT_READINESS",
        websiteUrl: "https://lnct.ac.in",
      },
    }),
    prisma.institution.upsert({
      where: { name: "LNCT University, Bhopal" },
      update: {},
      create: {
        name: "LNCT University, Bhopal",
        city: "Bhopal",
        state: "Madhya Pradesh",
        cellTheme: "RESEARCH_INNOVATION",
        websiteUrl: "https://lnctu.ac.in",
      },
    }),
    prisma.institution.upsert({
      where: { name: "Oriental Group of Institutes, Bhopal" },
      update: {},
      create: {
        name: "Oriental Group of Institutes, Bhopal",
        city: "Bhopal",
        state: "Madhya Pradesh",
        cellTheme: "AI_IN_BUSINESS",
        websiteUrl: "https://oriental.ac.in",
      },
    }),
    prisma.institution.upsert({
      where: { name: "RNTU, Bhopal" },
      update: {},
      create: {
        name: "RNTU, Bhopal",
        city: "Bhopal",
        state: "Madhya Pradesh",
        cellTheme: "AGRITECH",
        websiteUrl: "https://rntu.ac.in",
      },
    }),
    prisma.institution.upsert({
      where: { name: "Scope Global Skills University, Bhopal" },
      update: {},
      create: {
        name: "Scope Global Skills University, Bhopal",
        city: "Bhopal",
        state: "Madhya Pradesh",
        cellTheme: "SKILL_DEVELOPMENT",
        websiteUrl: "https://scopeglobal.ac.in",
      },
    }),
  ]);

  console.log(`✅ ${institutions.length} institutions created`);

  // ─── Super Admin ──────────────────────────────────────────────────────────
  const superAdmin = await ensureUser({
    label: "Super Admin",
    email: process.env.SEED_SUPER_ADMIN_EMAIL?.trim() || "superadmin@ciisic.in",
    name: "Super Admin",
    role: "SUPER_ADMIN",
    password: adminPassword("SEED_SUPER_ADMIN_PASSWORD"),
  });

  // ─── CII Admin ────────────────────────────────────────────────────────────
  const ciiAdmin = await ensureUser({
    label: "CII Admin",
    email: process.env.SEED_CII_ADMIN_EMAIL?.trim() || "admin@ciisic.in",
    name: "CII Admin",
    role: "CII_ADMIN",
    password: adminPassword("SEED_CII_ADMIN_PASSWORD"),
  });

  // ─── Institution SPOC ─────────────────────────────────────────────────────
  // Demo partner account (demo password only applies when the account is first created)
  const spocUser = await ensureUser({
    label: "Institution SPOC (demo)",
    email: "spoc@jlu.edu.in",
    name: "Dr. Priya Sharma",
    role: "INSTITUTION_SPOC",
    password: "Spoc@1234",
  });

  await prisma.institutionProfile.upsert({
    where: { userId: spocUser.id },
    update: {},
    create: {
      userId: spocUser.id,
      institutionId: institutions[0].id,
      designation: "Associate Professor & CII Cell Coordinator",
      department: "Management Studies",
    },
  });

  // ─── Industry SPOC ────────────────────────────────────────────────────────
  // Demo partner account (demo password only applies when the account is first created)
  const industryUser = await ensureUser({
    label: "Industry SPOC (demo)",
    email: "hr@techcorp.com",
    name: "Rahul Mehta",
    role: "INDUSTRY_SPOC",
    password: "Industry@1234",
  });

  const industryProfile = await prisma.industryProfile.upsert({
    where: { userId: industryUser.id },
    update: {},
    create: {
      userId: industryUser.id,
      companyName: "TechCorp Solutions Pvt Ltd",
      industry: "Information Technology",
      websiteUrl: "https://techcorp.example.com",
      isCIIMember: true,
      memberSince: new Date("2023-01-01"),
    },
  });

  // ─── Sample Challenges ────────────────────────────────────────────────────
  // The samples are published, so they carry a CII approval (by the seeded CII admin)
  // like any problem approved from the admin dashboard.
  const sampleApproval = {
    reviewerId: ciiAdmin.id,
    reviewedAt: new Date(),
    reviewRemarks: "Sample problem added with the demo data",
  };
  const challenge1 = await prisma.challenge.upsert({
    where: { id: "seed-challenge-001" },
    // Older copies were published without a recorded approval
    update: sampleApproval,
    create: {
      id: "seed-challenge-001",
      title: "AI-Powered Customer Churn Prediction System",
      description: `<h2>Overview</h2>
<p>TechCorp Solutions is facing significant customer churn in its SaaS product. We need an intelligent system that can predict which customers are likely to churn in the next 30–90 days.</p>
<h2>Background</h2>
<p>Our product has 50,000+ active users. We have 18 months of behavioral data available including login frequency, feature usage, support tickets, and billing history.</p>`,
      problemStatement:
        "Build a machine learning model that predicts customer churn with >80% accuracy using behavioral and transactional data.",
      domain: "AI_IN_BUSINESS",
      status: "OPEN",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      budgetRange: "₹50,000 – ₹1,00,000",
      tags: ["Machine Learning", "Python", "Data Science", "SaaS"],
      industryProfileId: industryProfile.id,
      publishedAt: new Date(),
      ...sampleApproval,
    },
  });

  const challenge2 = await prisma.challenge.upsert({
    where: { id: "seed-challenge-002" },
    // Older copies were published without a recorded approval
    update: sampleApproval,
    create: {
      id: "seed-challenge-002",
      title: "Smart Agriculture Monitoring Dashboard",
      description: `<h2>Overview</h2>
<p>We need a web-based dashboard that integrates IoT sensor data from farms to provide real-time monitoring of soil moisture, temperature, humidity, and crop health.</p>`,
      problemStatement:
        "Design and develop a React-based dashboard that visualizes real-time agricultural sensor data with alerts and historical trend analysis.",
      domain: "AGRITECH",
      status: "OPEN",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      budgetRange: "₹25,000 – ₹75,000",
      tags: ["React", "IoT", "Dashboard", "Agriculture", "Data Visualization"],
      industryProfileId: industryProfile.id,
      publishedAt: new Date(),
      ...sampleApproval,
    },
  });

  console.log(`✅ Sample challenges created: ${challenge1.title}, ${challenge2.title}`);

  // ─── Sample Solution (submitted by the institution SPOC for its team) ─────
  await prisma.proposal.upsert({
    where: { id: "seed-proposal-001" },
    update: {},
    create: {
      id: "seed-proposal-001",
      challengeId: challenge1.id,
      institutionId: institutions[0].id,
      submittedById: spocUser.id,
      status: "SUBMITTED",
      title: "Gradient-boosted churn early-warning system",
      summary:
        "We propose a gradient-boosted model on 18 months of usage and billing signals, with weekly risk scores surfaced in a lightweight dashboard for the customer success team.",
      technologiesUsed: ["Python", "XGBoost", "FastAPI", "React"],
      teamName: "JLU Data Insights Lab",
      teamLead: {
        name: "Arjun Verma",
        email: "arjun.verma@jlu.edu.in",
        department: "Computer Science & Engineering",
        yearOfStudy: "3rd Year UG",
      },
      teamMembers: [{ name: "Neha Tiwari", email: "neha.tiwari@jlu.edu.in", role: "ML Engineer" }],
      facultyMentor: {
        name: "Dr. Priya Sharma",
        designation: "Associate Professor",
        email: "spoc@jlu.edu.in",
      },
    },
  });
  console.log("✅ Sample solution created for challenge 1");

  // ─── Audit log seeds ──────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: superAdmin.id,
      newValue: { note: "Initial seed" },
    },
  });

  console.log("\n✅ Seed complete!\n");
  if (createdLogins.length === 0) {
    console.log("No new accounts were created; existing passwords were left unchanged.");
  } else {
    console.log("─── New accounts (shown once — store these somewhere safe) ───");
    for (const login of createdLogins) {
      console.log(`${login.label.padEnd(26)} ${login.email.padEnd(26)} / ${login.password}`);
    }
    console.log("──────────────────────────────────────────────────────────────");
    console.log("Change these passwords after the first login (Change Password in each dashboard).");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
