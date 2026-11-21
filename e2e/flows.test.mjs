/**
 * End-to-end flows against a real backend + real (throwaway) PostgreSQL.
 * Run through run.mjs, which starts everything and sets E2E_API / E2E_BACKEND_LOG.
 * The tests run in order and build on each other (one shared, freshly seeded database).
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const API = process.env.E2E_API ?? "http://localhost:3997";
const LOG = process.env.E2E_BACKEND_LOG;

// Seeded accounts (see backend/prisma/seed.ts and run.mjs)
const ADMIN = { email: "admin@ciisic.in", password: "E2E-CiiAdmin-Pass-2026" };
const INSTITUTION = { email: "spoc@jlu.edu.in", password: "Spoc@1234" };
const INDUSTRY = { email: "hr@techcorp.com", password: "Industry@1234" };

const inDays = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
const unique = Date.now().toString(36);

async function api(path, { method = "GET", body, token, ip } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  // Give each scenario its own "network" so per-IP limits don't interfere
  headers["x-forwarded-for"] = ip ?? `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, data: json?.data };
}

async function login({ email, password }) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.250" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  assert.equal(res.status, 200, `login failed for ${email}: ${json?.message}`);
  return json.token;
}

/** Unsent emails are appended to this file by the backend (EMAIL_OUTBOX_FILE). */
const OUTBOX = process.env.E2E_OUTBOX;

function outbox() {
  try {
    return OUTBOX ? readFileSync(OUTBOX, "utf8") : "";
  } catch {
    return "";
  }
}

/** Find an email in the outbox (written synchronously, so no waiting is needed). */
function findEmail(pattern, fromOffset = 0) {
  return outbox().slice(fromOffset).match(pattern);
}

/** Backend console output, for debugging failures. */
export function backendLog() {
  return LOG ? readFileSync(LOG, "utf8") : "";
}

const problem = (title) => ({
  title,
  description: "Foam builds up in our fermentation tanks during peak load and overflows.",
  problemStatement: "Detect foam early and trigger anti-foam dosing automatically.",
  domain: "RESEARCH_INNOVATION",
  deadline: inDays(30),
  budgetRange: "Rs 5,00,000",
  existingProcess: "Operators check each tank by hand twice a shift.",
  requiredSkills: ["Computer vision", "PLC"],
  difficultyLevel: "Hard",
});

const state = {};

describe("1. Public visitor", () => {
  it("API is healthy and protected routes need a login", async () => {
    assert.equal((await api("/api/health")).status, 200);
    assert.equal((await api("/api/proposals")).status, 401);
  });

  it("sees published problems without contact details or budget", async () => {
    const { status, data } = await api("/api/challenges");
    assert.equal(status, 200);
    const seeded = data.data.find((c) => c.id === "seed-challenge-001");
    assert.ok(seeded, "seeded problem is listed");
    assert.equal(seeded.contact, undefined);
    assert.equal(seeded.budgetRange, undefined);
    assert.equal(seeded.industry.email, undefined);
  });

  it("cannot see an institution's contact person", async () => {
    const { data } = await api("/api/institutions");
    state.institutionId = data.data.find((i) => i.name.startsWith("Jagran Lakecity")).id;
    const detail = await api(`/api/institutions/${state.institutionId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.institutionProfile, undefined);
  });

  it("submits a problem as an unregistered organisation ('Other')", async () => {
    const { status, data, json } = await api("/api/public/challenges", {
      method: "POST",
      body: {
        ...problem(`E2E Other org problem ${unique}`),
        organisationName: `E2E Acme Bio ${unique}`,
        orgSector: "Pharmaceuticals",
        orgCity: "Indore",
        orgState: "Madhya Pradesh",
        contactName: "Asha Rao",
        contactDesignation: "Plant Head",
        contactEmail: `asha.${unique}@acme-bio.example`,
        contactPhone: "+91 98765 43210",
      },
    });
    assert.equal(status, 201, json?.message);
    assert.match(data.referenceCode, /^CII-\d{4}-[A-Z2-9]{6}$/);
    state.otherProblemId = data.id;
    assert.ok(
      findEmail(new RegExp(`"to":"asha\\.${unique}@acme-bio\\.example","subject":"Problem statement received`)),
      "acknowledgement email was sent"
    );
  });

  it("submits a problem for a registered company from the dropdown", async () => {
    const orgs = await api("/api/public/industries");
    const techcorp = orgs.data.find((o) => o.companyName.startsWith("TechCorp"));
    assert.ok(techcorp, "TechCorp is in the dropdown");
    assert.equal(techcorp.email, undefined, "dropdown exposes no contact details");

    const { status, data } = await api("/api/public/challenges", {
      method: "POST",
      body: {
        ...problem(`E2E Registered org problem ${unique}`),
        industryProfileId: techcorp.id,
        contactName: "Someone Unknown",
        contactDesignation: "Engineer",
        contactEmail: `someone.${unique}@gmail.com`,
        contactPhone: "+91 90000 00000",
      },
    });
    assert.equal(status, 201);
    state.registeredProblemId = data.id;
  });

  it("is turned away by the spam trap", async () => {
    const { status } = await api("/api/public/challenges", {
      method: "POST",
      body: { ...problem("Bot submission"), organisationName: "Bot", orgSector: "x", orgCity: "x", orgState: "x",
        contactName: "Bot", contactDesignation: "Bot", contactEmail: "bot@bot.example", contactPhone: "0000000",
        companyFax: "filled-by-a-bot" },
    });
    assert.equal(status, 422);
  });
});

describe("2. CII admin reviews submissions", () => {
  before(async () => {
    state.adminToken = await login(ADMIN);
  });

  it("sees what is waiting in the overview", async () => {
    const { status, data } = await api("/api/admin/stats", { token: state.adminToken });
    assert.equal(status, 200);
    assert.ok(data.summary.pendingProblems >= 2);
    assert.ok(data.summary.publicPendingProblems >= 2);
  });

  it("gets reviewer hints on pending problems", async () => {
    const { data } = await api("/api/challenges?status=PENDING_APPROVAL&limit=100", { token: state.adminToken });
    const other = data.data.find((c) => c.id === state.otherProblemId);
    const registered = data.data.find((c) => c.id === state.registeredProblemId);
    assert.equal(other.review.registeredCompany, false);
    assert.equal(other.isNewOrganisation, true);
    assert.equal(registered.review.registeredCompany, true);
    assert.equal(registered.review.emailMatchesCompany, false, "gmail address flagged for a registered company");
    assert.equal(registered.contact.email, `someone.${unique}@gmail.com`);
  });

  it("approves the 'Other' problem, which then appears publicly", async () => {
    const res = await api(`/api/admin/challenges/${state.otherProblemId}/review`, {
      method: "POST", token: state.adminToken, body: { action: "APPROVE", remarks: "Clear scope" },
    });
    assert.equal(res.status, 200);
    const pub = await api(`/api/challenges/${state.otherProblemId}`);
    assert.equal(pub.status, 200);
    assert.equal(pub.data.status, "OPEN");
    assert.equal(pub.data.contact, undefined);
    assert.equal(pub.data.existingProcess, "Operators check each tank by hand twice a shift.");
  });

  it("rejects the suspicious one, which stays hidden", async () => {
    const res = await api(`/api/admin/challenges/${state.registeredProblemId}/review`, {
      method: "POST", token: state.adminToken, body: { action: "REJECT", remarks: "Could not verify the submitter" },
    });
    assert.equal(res.status, 200);
    assert.equal((await api(`/api/challenges/${state.registeredProblemId}`)).status, 404);
  });

  it("invites the 'Other' organisation to register, only once", async () => {
    const first = await api(`/api/admin/challenges/${state.otherProblemId}/invite`, { method: "POST", token: state.adminToken });
    assert.equal(first.status, 200);
    assert.ok(first.data.inviteSentAt);
    const second = await api(`/api/admin/challenges/${state.otherProblemId}/invite`, { method: "POST", token: state.adminToken });
    assert.equal(second.status, 409);
  });

  it("records it all in the activity log", async () => {
    const { data } = await api("/api/admin/audit?action=CHALLENGE_&limit=50", { token: state.adminToken });
    const actions = data.data.map((e) => e.action);
    assert.ok(actions.includes("CHALLENGE_APPROVED"));
    assert.ok(actions.includes("CHALLENGE_REJECTED"));
  });
});

describe("3. Partner registration", () => {
  const company = {
    email: `founder.${unique}@neworg.example`,
    password: "NewOrg@2026",
    name: "New Org Founder",
    role: "INDUSTRY_SPOC",
    companyName: `E2E New Org ${unique}`,
    industry: "Manufacturing",
    phone: "+91 91234 56789",
    designation: "Founder",
  };

  it("cannot register as an admin", async () => {
    const { status } = await api("/api/auth/register", {
      method: "POST", body: { ...company, email: `x.${unique}@evil.example`, role: "SUPER_ADMIN" },
    });
    assert.equal(status, 422);
  });

  it("registers and must wait for approval", async () => {
    const reg = await api("/api/auth/register", { method: "POST", body: company });
    assert.equal(reg.status, 201);
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: company.email, password: company.password }),
    });
    assert.equal(res.status, 403);
  });

  it("can sign in once a CII admin approves", async () => {
    const pending = await api("/api/admin/registrations?status=PENDING", { token: state.adminToken });
    const mine = pending.data.find((r) => r.email === company.email);
    assert.ok(mine, "registration is listed for review");
    const review = await api(`/api/admin/registrations/${mine.id}/review`, {
      method: "POST", token: state.adminToken, body: { action: "APPROVE" },
    });
    assert.equal(review.status, 200);
    assert.ok(await login(company));
  });
});

describe("4. Institution submits a solution, industry reviews it", () => {
  before(async () => {
    state.institutionToken = await login(INSTITUTION);
    state.industryToken = await login(INDUSTRY);
  });

  it("institution submits a team solution", async () => {
    const { status, data, json } = await api("/api/challenges/seed-challenge-002/proposals", {
      method: "POST",
      token: state.institutionToken,
      body: {
        title: "Edge vision for line inspection",
        summary: "A camera-based inspection system running on an edge device beside the line.",
        detailedApproach: "Collect images, train a defect model, deploy on an edge box.",
        deliverables: "Prototype and report",
        technologiesUsed: ["Python", "OpenCV"],
        teamName: "JLU Vision Lab",
        teamLead: { name: "Arjun Verma", email: "arjun@jlu.example", department: "CSE", yearOfStudy: "3rd" },
        teamMembers: [{ name: "Neha", email: "neha@jlu.example", role: "ML" }],
        facultyMentor: { name: "Dr. Priya Sharma", designation: "Associate Professor", email: "spoc@jlu.edu.in" },
      },
    });
    assert.equal(status, 201, json?.message);
    state.proposalId = data.id;
    assert.equal(data.deliverables, "Prototype and report");
  });

  it("a second solution from the same institution is refused", async () => {
    const { status } = await api("/api/challenges/seed-challenge-002/proposals", {
      method: "POST", token: state.institutionToken,
      body: { summary: "A second attempt that should not be allowed through.", teamName: "Dup",
        teamLead: { name: "Dup Lead", email: "dup@jlu.example" } },
    });
    assert.equal(status, 409);
  });

  it("industry sees the solution without the team's contact details", async () => {
    const { data } = await api("/api/proposals", { token: state.industryToken });
    const p = data.data.find((x) => x.id === state.proposalId);
    assert.ok(p, "industry can see the solution for its problem");
    assert.equal(p.team.name, "JLU Vision Lab");
    assert.equal(p.team.lead.email, undefined);
  });

  it("industry approves it and the institution sees the feedback", async () => {
    const review = await api(`/api/proposals/${state.proposalId}`, {
      method: "PATCH", token: state.industryToken,
      body: { status: "APPROVED", feedbackByIndustry: "Great work — let's pilot it." },
    });
    assert.equal(review.status, 200);
    const { data } = await api("/api/proposals", { token: state.institutionToken });
    const p = data.data.find((x) => x.id === state.proposalId);
    assert.equal(p.status, "APPROVED");
    assert.equal(p.feedbackByIndustry, "Great work — let's pilot it.");
  });
});

describe("5. Industry owner cannot skip CII review", () => {
  it("a new problem waits for review and cannot be self-published", async () => {
    const created = await api("/api/challenges", {
      method: "POST", token: state.industryToken, body: problem(`E2E Portal problem ${unique}`),
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.status, "PENDING_APPROVAL");
    const publish = await api(`/api/challenges/${created.data.id}`, {
      method: "PATCH", token: state.industryToken, body: { status: "OPEN" },
    });
    assert.equal(publish.status, 403);
  });
});

describe("5b. Mobile number privacy", () => {
  const PHONE = "+91 91234 56789";

  it("follows the company's choice and never triggers a new review", async () => {
    const created = await api("/api/challenges", {
      method: "POST",
      token: state.industryToken,
      body: { ...problem(`E2E Phone privacy ${unique}`), contactPhone: PHONE, phoneVisibility: "INSTITUTION_SPOCS" },
    });
    assert.equal(created.status, 201, created.json?.message);
    const id = created.data.id;

    // Not published yet: nobody else gets the number
    assert.equal((await api(`/api/challenges/${id}`, { token: state.institutionToken })).status, 404);

    const approved = await api(`/api/admin/challenges/${id}/review`, {
      method: "POST", token: state.adminToken, body: { action: "APPROVE", remarks: "Clear scope" },
    });
    assert.equal(approved.status, 200);

    // Institution SPOCs only
    const spoc = await api(`/api/challenges/${id}`, { token: state.institutionToken });
    assert.equal(spoc.data.contact.phone, PHONE);
    assert.equal(spoc.data.contact.email, null);
    assert.equal(spoc.data.phoneVisibility, undefined);
    assert.ok(!JSON.stringify((await api(`/api/challenges/${id}`)).json).includes(PHONE));

    // Everyone, changed by the owner: stays published
    const everyone = await api(`/api/challenges/${id}`, {
      method: "PATCH", token: state.industryToken, body: { phoneVisibility: "EVERYONE" },
    });
    assert.equal(everyone.status, 200);
    assert.equal(everyone.data.status, "OPEN");
    assert.equal((await api(`/api/challenges/${id}`)).data.contact.phone, PHONE);

    // No one
    await api(`/api/challenges/${id}`, {
      method: "PATCH", token: state.industryToken, body: { phoneVisibility: "NO_ONE" },
    });
    assert.ok(!JSON.stringify((await api(`/api/challenges/${id}`)).json).includes(PHONE));
    assert.ok(!JSON.stringify((await api(`/api/challenges/${id}`, { token: state.institutionToken })).json).includes(PHONE));
    const owner = await api(`/api/challenges/${id}`, { token: state.industryToken });
    assert.equal(owner.data.contact.phone, PHONE);
    assert.equal(owner.data.phoneVisibility, "NO_ONE");
  });
});

describe("5c. Several logins for one company", () => {
  const memberEmail = `teammate.${unique}@techcorp.example`;
  const memberPassword = "Teammate@1234";
  let draftId, memberId, memberToken;

  it("the main account adds a colleague, who sets a password from a one-time link", async () => {
    const draft = await api("/api/challenges", {
      method: "POST", token: state.industryToken, body: { ...problem(`E2E Team problem ${unique}`), contactPhone: "+91 90000 11111" },
    });
    assert.equal(draft.status, 201);
    draftId = draft.data.id;

    const added = await api("/api/industry/team", {
      method: "POST", token: state.industryToken, body: { name: "Team Mate", email: memberEmail },
    });
    assert.equal(added.status, 201, added.json?.message);
    assert.equal(added.data.member.status, "INVITED");
    memberId = added.data.member.id;

    const token = new URL(added.data.setupUrl).searchParams.get("token");
    const set = await api("/api/auth/reset-password", { method: "POST", body: { token, newPassword: memberPassword } });
    assert.equal(set.status, 200);
    const reused = await api("/api/auth/reset-password", { method: "POST", body: { token, newPassword: memberPassword } });
    assert.equal(reused.status, 400, "the link works only once");
    memberToken = await login({ email: memberEmail, password: memberPassword });
  });

  it("the colleague sees the same company dashboard, including unpublished problems", async () => {
    const me = await api("/api/auth/me", { token: memberToken });
    assert.match(me.data.industryProfile.companyName, /^TechCorp/);
    const problemView = await api(`/api/challenges/${draftId}`, { token: memberToken });
    assert.equal(problemView.status, 200);
    assert.equal(problemView.data.ownedByRequester, true);
    assert.equal(problemView.data.contact.phone, "+91 90000 11111");

    const created = await api("/api/challenges", {
      method: "POST", token: memberToken, body: problem(`E2E Problem by a teammate ${unique}`),
    });
    assert.equal(created.status, 201);
    const seenByMain = await api(`/api/challenges/${created.data.id}`, { token: state.industryToken });
    assert.equal(seenByMain.data.ownedByRequester, true);

    const proposals = await api("/api/proposals", { token: memberToken });
    const mainProposals = await api("/api/proposals", { token: state.industryToken });
    assert.equal(proposals.data.pagination.total, mainProposals.data.pagination.total);
  });

  it("only the main account can manage the team", async () => {
    const list = await api("/api/industry/team", { token: memberToken });
    assert.equal(list.data.canManage, false);
    assert.equal(list.data.members.length, 2);
    const add = await api("/api/industry/team", {
      method: "POST", token: memberToken, body: { name: "Someone Else", email: `else.${unique}@techcorp.example` },
    });
    assert.equal(add.status, 403);
    assert.equal((await api(`/api/industry/team/${memberId}`, { method: "DELETE", token: memberToken })).status, 403);
    assert.equal((await api("/api/industry/team", { token: state.institutionToken })).status, 403);
  });

  it("an email that already has an account cannot be added", async () => {
    const res = await api("/api/industry/team", {
      method: "POST", token: state.industryToken, body: { name: "Institution User", email: INSTITUTION.email },
    });
    assert.equal(res.status, 409);
  });

  it("a removed colleague loses access at once, even with a token they still hold", async () => {
    const removed = await api(`/api/industry/team/${memberId}`, { method: "DELETE", token: state.industryToken });
    assert.equal(removed.status, 200);
    assert.equal((await api(`/api/challenges/${draftId}`, { token: memberToken })).status, 404);
    assert.equal((await api("/api/auth/me", { token: memberToken })).status, 401);
    assert.equal((await api("/api/challenges", { method: "POST", token: memberToken, body: problem("Blocked") })).status, 400);
    const signIn = await api("/api/auth/login", { method: "POST", body: { email: memberEmail, password: memberPassword } });
    assert.equal(signIn.status, 401);
  });
});

describe("5d. CII standardises an industry's raw file", () => {
  const pdf = () => {
    const form = new FormData();
    form.append("file", new File(["%PDF-1.7 standardised"], "Standardised_Brief.pdf", { type: "application/pdf" }));
    return form;
  };
  const uploadAs = (id, token) =>
    fetch(`${API}/api/admin/challenges/${id}/standardised-file`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "x-forwarded-for": "198.51.100.77" },
      body: pdf(),
    });

  it("institutions get the standardised file, while CII and the company keep the original", async () => {
    const RAW = `https://files.example/raw-${unique}.pdf`;
    const created = await api("/api/challenges", {
      method: "POST", token: state.industryToken, body: { ...problem(`E2E Raw file ${unique}`), attachmentUrls: [RAW] },
    });
    assert.equal(created.status, 201);
    const id = created.data.id;
    await api(`/api/admin/challenges/${id}/review`, {
      method: "POST", token: state.adminToken, body: { action: "APPROVE" },
    });

    assert.equal((await uploadAs(id, state.industryToken)).status, 403);
    assert.equal((await uploadAs(id, state.institutionToken)).status, 403);
    const saved = await uploadAs(id, state.adminToken);
    assert.equal(saved.status, 200);
    const clean = (await saved.json()).data.standardisedFile.url;
    assert.match(clean, /\.pdf$/);

    for (const token of [undefined, state.institutionToken]) {
      const view = await api(`/api/challenges/${id}`, { token });
      assert.deepEqual(view.data.attachmentUrls, [clean]);
      assert.ok(!JSON.stringify(view.json).includes(RAW), "raw file is not sent");
    }
    const owner = await api(`/api/challenges/${id}`, { token: state.industryToken });
    assert.deepEqual(owner.data.attachmentUrls, [RAW]);

    // A new raw file from the company makes the standardised version out of date
    const NEW_RAW = `https://files.example/new-${unique}.pdf`;
    await api(`/api/challenges/${id}`, {
      method: "PATCH", token: state.industryToken, body: { attachmentUrls: [NEW_RAW] },
    });
    const after = await api(`/api/challenges/${id}`, { token: state.adminToken });
    assert.equal(after.data.standardisedFile, null);
    assert.equal(after.data.status, "PENDING_APPROVAL");
  });
});

describe("6. Password reset", () => {
  it("emails a link that sets a new password", async () => {
    const before = outbox().length;
    const req = await api("/api/auth/forgot-password", { method: "POST", body: { email: INSTITUTION.email } });
    assert.equal(req.status, 200);
    const match = findEmail(/reset-password\?token=([a-f0-9]{64})/, before);
    assert.ok(match, "reset link was written to the (mock) email");

    const newPassword = "NewSpoc@2026";
    const reset = await api("/api/auth/reset-password", { method: "POST", body: { token: match[1], newPassword } });
    assert.equal(reset.status, 200);
    assert.ok(await login({ email: INSTITUTION.email, password: newPassword }));

    const old = await fetch(`${API}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(INSTITUTION),
    });
    assert.equal(old.status, 401);
    const reuse = await api("/api/auth/reset-password", { method: "POST", body: { token: match[1], newPassword: "Another@2026" } });
    assert.equal(reuse.status, 400, "a reset link works only once");
  });
});

describe("7. Abuse protection", () => {
  it("pauses sign-in after 10 wrong passwords", async () => {
    const victim = { email: "hr@techcorp.com", password: "definitely-wrong" };
    for (let i = 0; i < 10; i++) {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${i + 1}` },
        body: JSON.stringify(victim),
      });
      assert.equal(res.status, 401);
    }
    const blocked = await fetch(`${API}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.99" },
      body: JSON.stringify(INDUSTRY),
    });
    assert.equal(blocked.status, 429, "even the right password is paused for 15 minutes");
  });

  it("the reminder job only runs with its secret", async () => {
    assert.equal((await api("/api/cron/deadline-notifications")).status, 401);
    const res = await fetch(`${API}/api/cron/deadline-notifications`, { headers: { authorization: "Bearer e2e-cron-secret" } });
    assert.equal(res.status, 200);
  });

  it("forged login tokens are rejected", async () => {
    const [h, , s] = state.industryToken.split(".");
    const forged = Buffer.from(JSON.stringify({ id: "x", email: "x@x", role: "SUPER_ADMIN", name: "x", exp: 9999999999 })).toString("base64url");
    assert.equal((await api("/api/admin/stats", { token: `${h}.${forged}.${s}` })).status, 401);
  });
});
