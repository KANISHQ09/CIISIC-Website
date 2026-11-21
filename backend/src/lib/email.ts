import nodemailer from "nodemailer";
import { appendFileSync } from "node:fs";

// Retrieve SMTP settings from env
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "no-reply@ciisic.in";

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email] Message sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Email] Failed to send email to ${to}:`, error);
      throw error;
    }
  } else {
    // In development or when SMTP is not configured, print to the console
    console.log(`
============================================================
[MOCK EMAIL SENT]
To:      ${to}
Subject: ${subject}
Text:    ${text}
============================================================
    `);
    // Optional local "outbox": when EMAIL_OUTBOX_FILE is set, each unsent email is also
    // appended to that file right away (used by the end-to-end tests; handy in development).
    if (process.env.EMAIL_OUTBOX_FILE) {
      appendFileSync(
        process.env.EMAIL_OUTBOX_FILE,
        JSON.stringify({ to, subject, text, sentAt: new Date().toISOString() }) + "\n"
      );
    }
    return { mock: true, messageId: "mock-id-" + Date.now() };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const subject = "Reset your CIISIC Password";
  const text = `Hello ${name},\n\nYou requested a password reset. Please use the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`;
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Password Reset Request</h2>
      <p>Hello ${safeName},</p>
      <p>You requested a password reset for your CIISIC platform account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="margin: 20px 0;">
        <a href="${safeUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #64748b;">${safeUrl}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
}

export async function sendProposalStatusEmail(
  to: string,
  name: string,
  status: string,
  challengeTitle: string,
  revisionNotes?: string | null
) {
  const subject = `CIISIC Proposal Status Updated: ${status.replace(/_/g, " ")}`;
  
  let noteText = "";
  let noteHtml = "";
  
  if (status === "REVISION_REQUESTED" && revisionNotes) {
    noteText = `\n\nRevision notes from reviewer:\n${revisionNotes}`;
    noteHtml = `
      <div style="background-color: #fef08a; border-left: 4px solid #eab308; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 10px 0; color: #854d0e;">Revision Required:</h4>
        <p style="margin: 0; color: #713f12;">${escapeHtml(revisionNotes)}</p>
      </div>
    `;
  }

  const text = `Hello ${name},\n\nThe status of your proposal for the challenge "${challengeTitle}" has been updated to ${status}.${noteText}\n\nPlease log in to the portal to view details.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Proposal Status Update</h2>
      <p>Hello ${escapeHtml(name)},</p>
      <p>The status of your proposal for the challenge <strong>"${escapeHtml(challengeTitle)}"</strong> has been updated to:</p>
      <div style="margin: 15px 0;">
        <span style="font-size: 16px; font-weight: bold; background-color: #e2e8f0; padding: 6px 12px; border-radius: 4px; display: inline-block;">${escapeHtml(status.replace(/_/g, " "))}</span>
      </div>
      ${noteHtml}
      <p>Please log in to the CIISIC portal to check the updates and continue the process.</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
}

// ─── Public problem submission emails ─────────────────────────────────────────

/** Escape text typed by users before placing it in an HTML email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <h2 style="color: #063028;">${heading}</h2>
      ${bodyHtml}
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8;">CII Student Innovation Challenge (CIISIC) — this is an automated message.</p>
    </div>
  `;
}

/** Sent right after a problem statement is submitted (with or without login). */
export async function sendProblemReceivedEmail(
  to: string,
  name: string,
  problemTitle: string,
  referenceCode: string
) {
  const subject = `Problem statement received — ${referenceCode}`;
  const text =
    `Hello ${name},\n\nThank you for submitting "${problemTitle}" to CIISIC.\n` +
    `Your reference ID is ${referenceCode}.\n\n` +
    `CII officials will review the submission and publish it to partner institutions once it is approved. ` +
    `We will email you once it has been reviewed.`;
  const html = emailShell(
    "Problem statement received",
    `<p>Hello ${escapeHtml(name)},</p>
     <p>Thank you for submitting <strong>"${escapeHtml(problemTitle)}"</strong> to CIISIC.</p>
     <p>Your reference ID is
       <span style="font-family: monospace; font-weight: bold; background: #edf4f0; padding: 4px 8px; border-radius: 4px;">${escapeHtml(referenceCode)}</span></p>
     <p>CII officials will review the submission and publish it to partner institutions once it is approved. We will email you once it has been reviewed.</p>`
  );
  return sendEmail({ to, subject, html, text });
}

/** Sent when a CII admin approves or rejects a submitted problem statement. */
export async function sendProblemDecisionEmail(
  to: string,
  name: string,
  problemTitle: string,
  referenceCode: string | null,
  approved: boolean,
  remarks?: string | null
) {
  const ref = referenceCode ? ` (${referenceCode})` : "";
  const subject = approved
    ? `Your problem statement is now published${ref}`
    : `Update on your problem statement${ref}`;
  const outcome = approved
    ? "has been approved by CII and is now published to partner institutions."
    : "could not be published after CII review.";
  const text =
    `Hello ${name},\n\nYour problem statement "${problemTitle}"${ref} ${outcome}` +
    (remarks ? `\n\nRemarks from the reviewer:\n${remarks}` : "");
  const html = emailShell(
    approved ? "Problem statement published" : "Problem statement review update",
    `<p>Hello ${escapeHtml(name)},</p>
     <p>Your problem statement <strong>"${escapeHtml(problemTitle)}"</strong>${escapeHtml(ref)} ${outcome}</p>
     ${
       remarks
         ? `<div style="background: #f8fafc; border-left: 4px solid #c48825; padding: 12px 15px; margin: 15px 0;">
              <strong>Remarks from the reviewer:</strong><br/>${escapeHtml(remarks)}
            </div>`
         : ""
     }`
  );
  return sendEmail({ to, subject, html, text });
}

/** Sent when CII invites an unregistered ("Other") organisation to create an industry account. */
export async function sendIndustryInviteEmail(
  to: string,
  name: string,
  organisationName: string,
  registerUrl: string
) {
  const subject = "Invitation to register on the CIISIC industry portal";
  const text =
    `Hello ${name},\n\nThank you for sharing a problem statement from ${organisationName} with CII.\n` +
    `Register your organisation on the CIISIC industry portal so it appears in the organisation list ` +
    `next time and you can track your problem statements:\n${registerUrl}`;
  const html = emailShell(
    "You're invited to the CIISIC industry portal",
    `<p>Hello ${escapeHtml(name)},</p>
     <p>Thank you for sharing a problem statement from <strong>${escapeHtml(organisationName)}</strong> with CII.</p>
     <p>Register your organisation on the CIISIC industry portal so it appears in the organisation list next time and you can track your problem statements.</p>
     <div style="margin: 20px 0;">
       <a href="${escapeHtml(registerUrl)}" style="background-color: #063028; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Register your organisation</a>
     </div>
     <p style="word-break: break-all; color: #64748b;">${escapeHtml(registerUrl)}</p>`
  );
  return sendEmail({ to, subject, html, text });
}
