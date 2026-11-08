# CIISIC — end-to-end checks

Two layers:

1. **Automated** (`flows.test.mjs`): every role's main flows through the real API and a real,
   throwaway PostgreSQL database. Run it before every release.
2. **Manual** (this checklist): the screens, against the same throwaway database, so nothing
   real is touched.

## 1. Run the automated suite

```bash
cd e2e
npm install          # first time only (downloads a local PostgreSQL)
npm test
```

It starts a temporary database, loads the schema and seed data, builds and starts the backend on
`http://localhost:3997`, runs the flows, then stops everything and deletes the database.
Your Supabase database, `.env` files and a running dev server are not touched.

Expected: `ℹ pass 24`, `ℹ fail 0`.

## 2. Start the stack for manual checks

Terminal 1:

```bash
cd e2e
npm test -- --keep
```

Wait for "Test stack is running". Then, in terminal 2 (PowerShell):

```powershell
cd frontend
$env:VITE_API_URL="http://localhost:3997"; npm run dev
```

Open http://localhost:3000. To stop: Ctrl+C in terminal 1 (or create the file `e2e/.output/stop`).

### Test logins (only exist in the throwaway database)

| Role | Email | Password |
|---|---|---|
| CII Admin | admin@ciisic.in | `E2E-CiiAdmin-Pass-2026` |
| Institution SPOC | spoc@jlu.edu.in | `NewSpoc@2026` (the automated suite resets it from `Spoc@1234`) |
| Industry SPOC | hr@techcorp.com | `Industry@1234` (paused for 15 min after the suite's lockout test) |

"Sent" emails are written to `e2e/.output/outbox.jsonl` instead of being sent.

## 3. Manual checklist

Tick each item. Note the browser and screen size used.

### Public visitor (logged out)
- [ ] Home page loads; navigation shows Institution Portal, Industry Login, Submit a Problem.
- [ ] Footer shows "CII Admin Login".
- [ ] Problem Statements lists published problems; no budget or contact details shown.
- [ ] A problem's detail page shows all sections; missing ones say "Not provided".
- [ ] Submit a Problem → "Other" → fill all steps → confirmation shows a reference ID.
- [ ] The acknowledgement email appears in `e2e/.output/outbox.jsonl`.
- [ ] Submit a Problem → pick TechCorp from the dropdown → submit works.
- [ ] Old link `/industry/submit` goes to `/submit-problem`; `/student/login` goes home.
- [ ] Forgot password → message is the same for a registered and an unknown email.

### Site pages and home page (logged out)
- [ ] Nav shows Home, About, Problem Statements, Events, Opportunities and an Explore menu (Services, Institutions, Our Ecosystem, How It Works); each opens its own page at the top, with that tab underlined.
- [ ] At 1280 px wide the whole nav fits on one line; below that a menu button opens the same links.
- [ ] Every public page has the footer and its own browser-tab title (e.g. "Events · CIISIC").
- [ ] Home: banner slides on its own, pauses while hovered, and works with arrows, dots, keyboard arrows and (on a phone) swipe.
- [ ] Home: "Featured Problem Statements" shows only published problems that are still open, closing soonest first; with none open it says new ones are coming soon.
- [ ] Home: a featured card opens the problem, and its back link says "Back to Home".
- [ ] Events: shows "Coming soon" and a sample hackathon timeline marked "Sample timeline".
- [ ] Opportunities: shows the four categories marked "Coming soon".
- [ ] Institutions shows partner logos and counts; Problem Statements ends with the challenge areas.

### CII Admin
- [ ] Sign in via footer link → admin dashboard.
- [ ] Overview cards show waiting problems/registrations; clicking a card opens its tab.
- [ ] New public submissions show the reference ID, "Submitted without login", and either
      "New organisation (Other)" or "Registered partner" with the email-domain hint.
- [ ] Approve a problem → it appears on the public Problem Statements page.
- [ ] Reject a problem with remarks → it disappears from public view; decision email in outbox.
- [ ] "Invite to register" on an "Other" problem → shows "Invited <date>"; invite email in outbox.
- [ ] Partner Registrations → approve a pending one → that user can sign in.
- [ ] Solutions tab lists institution solutions; record a decision.
- [ ] Activity Log shows the actions above; filters (person, type, dates) narrow the list.
- [ ] Header shows only logo + profile menu on the dashboard; profile menu has
      "Return to Home" and "Sign Out"; on the home page the normal navigation returns (no login buttons).
- [ ] Opening `/industry/login` while signed in goes back to the admin dashboard.

### Institution SPOC
- [ ] Sign in → institution dashboard with Available Problems and Solutions tabs (no student tabs).
- [ ] Submit Solution on a problem → form shows the real problem title → submit → "Solution Submitted".
- [ ] A second solution to the same problem is refused with a clear message.

### Industry SPOC
- [ ] Sign in → industry dashboard lists own problems.
- [ ] Solutions for own problems are visible without team members' emails/phones.
- [ ] Approve a solution with feedback → institution sees the feedback.
- [ ] Editing an approved problem sends it back to "Pending approval".

### Security spot checks
- [ ] 10 wrong passwords for one account → "Too many unsuccessful sign-in attempts".
- [ ] Registration forms and reset page have the show/hide password eye.
- [ ] Phone width (375 px): no sideways scrolling on home, submit form, dashboards.

## 4. Before going live (outside this checklist)
- Render: `JWT_SECRET` (32+ chars) set; `CRON_SECRET` set if deadline reminders are scheduled.
- Vercel: `VITE_API_URL` points to the Render backend.
- Change the seeded admin passwords; remove/deactivate the demo partner accounts.
- SMTP configured when ready (until then emails are only logged).
