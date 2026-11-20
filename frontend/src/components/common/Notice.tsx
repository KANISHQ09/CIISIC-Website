import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';

/** A small boxed note shown beside a form field or above a form's button. */
export const Notice: React.FC<{
  title: string;
  children: React.ReactNode;
  tone?: 'info' | 'caution';
  className?: string;
}> = ({ title, children, tone = 'info', className = '' }) => {
  const caution = tone === 'caution';
  const Icon = caution ? ShieldCheck : Info;
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-xl border p-3.5 text-left ${
        caution ? 'bg-amber-50/70 border-amber-200' : 'bg-[#edf4f0] border-[#063028]/15'
      } ${className}`}
    >
      <Icon className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${caution ? 'text-amber-700' : 'text-[#063028]'}`} aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-stone-800">{title}</p>
        <div className="text-xs sm:text-[13px] leading-relaxed text-stone-700">{children}</div>
      </div>
    </div>
  );
};

/**
 * Asked for in CII's portal review (16 Nov 2026): documents shared on the portal must be
 * viewable by everyone who needs them. `viewers` names who that is on each form.
 */
export const DocumentAccessNotice: React.FC<{ viewers: string; className?: string }> = ({ viewers, className }) => (
  <Notice title="Make sure your document can be opened" tone="caution" className={className}>
    Before you upload or link a document, check that its access settings let {viewers} open it. For files on
    Google Drive, OneDrive or similar, set sharing to <strong>"Anyone with the link can view"</strong>. Restricted
    or password-protected files cannot be reviewed.
  </Notice>
);

/** Shown while submitting a problem statement. */
export const SubmissionDisclaimer: React.FC<{ className?: string }> = ({ className }) => (
  <Notice title="Before you submit" className={className}>
    Share only information your organisation is cleared to share outside the company. CII reviews every problem
    statement and publishes it to partner institutions only after approval. Your contact details are not shown
    publicly.
  </Notice>
);

/** Shown on the industry sign-in page. */
export const IndustryLoginDisclaimer: React.FC<{ className?: string }> = ({ className }) => (
  <Notice title="For registered industry partners" className={className}>
    Sign in only with your own account and keep your password private. Sign-ins and changes on the portal are
    recorded for security. New organisations can submit a problem without an account.
  </Notice>
);
