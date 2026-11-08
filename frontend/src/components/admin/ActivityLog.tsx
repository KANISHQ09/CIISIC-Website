import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, History, RotateCcw, Search } from 'lucide-react';
import { AuditEntry, fetchAuditLog } from '../../lib/api';

const PAGE_SIZE = 20;

/** Plain-language names for the actions the server records. */
const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'Signed in',
  USER_LOGOUT: 'Signed out',
  USER_REGISTERED: 'Registered an account',
  USER_ACTIVATED: 'Account activated',
  USER_DEACTIVATED: 'Account deactivated',
  USER_ROLE_CHANGED: 'Role changed',
  CHALLENGE_CREATED: 'Submitted a problem',
  CHALLENGE_UPDATED: 'Edited a problem',
  CHALLENGE_SUBMITTED: 'Sent a problem for review',
  CHALLENGE_APPROVED: 'Approved a problem',
  CHALLENGE_REJECTED: 'Rejected a problem',
  CHALLENGE_STATUS_CHANGED: 'Changed a problem status',
  CHALLENGE_DELETED: 'Archived a problem',
  INDUSTRY_INVITE_SENT: 'Invited an organisation to register',
  PROPOSAL_SUBMITTED: 'Submitted a solution',
  PROPOSAL_STATUS_CHANGED: 'Reviewed a solution',
  PROPOSAL_REVISION_REQUESTED: 'Requested solution changes',
  PROPOSAL_APPROVED: 'Approved a solution',
  PROPOSAL_REJECTED: 'Rejected a solution',
  MESSAGE_SENT: 'Sent a message',
  INSTITUTION_CREATED: 'Added an institution',
  INSTITUTION_UPDATED: 'Edited an institution',
  INSTITUTION_DELETED: 'Deleted an institution',
  FILE_UPLOADED: 'Uploaded a file',
};

/** Filter choices shown to admins (value is matched against the recorded action). */
const ACTION_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All activity' },
  { value: 'CHALLENGE_', label: 'Problem statements' },
  { value: 'PROPOSAL_', label: 'Solutions' },
  { value: 'USER_LOGIN', label: 'Sign-ins' },
  { value: 'USER_REGISTERED', label: 'Registrations' },
  { value: 'ADMIN_ACTION', label: 'Approvals & account changes' },
  { value: 'INDUSTRY_INVITE_SENT', label: 'Invitations' },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  CII_ADMIN: 'CII Admin',
  INDUSTRY_SPOC: 'Industry',
  INSTITUTION_SPOC: 'Institution',
};

/** What happened, in words — including the generic ADMIN_ACTION entries. */
function describe(entry: AuditEntry): string {
  if (entry.action === 'ADMIN_ACTION') {
    const v = entry.newValue ?? {};
    if (v.action === 'PASSWORD_CHANGED') return 'Changed their password';
    if (v.action === 'PASSWORD_RESET_COMPLETED') return 'Reset their password';
    if (v.approvalStatus === 'APPROVED') return 'Approved a registration';
    if (v.approvalStatus === 'REJECTED') return 'Rejected a registration';
    if (v.deleted) return 'Deleted a user';
    if (Array.isArray(v.updatedFields)) return 'Updated a profile';
    return 'Admin action';
  }
  return ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, ' ').toLowerCase();
}

/** A short extra line from the recorded values (titles, remarks, statuses). */
function details(entry: AuditEntry): string {
  const v = entry.newValue ?? {};
  const parts: string[] = [];
  if (typeof v.title === 'string') parts.push(`"${v.title}"`);
  if (typeof v.organisation === 'string') parts.push(v.organisation);
  if (typeof v.status === 'string' && entry.action !== 'ADMIN_ACTION') parts.push(`status: ${v.status.replace(/_/g, ' ').toLowerCase()}`);
  if (typeof v.reviewRemarks === 'string' && v.reviewRemarks) parts.push(`remarks: ${v.reviewRemarks}`);
  if (typeof v.remarks === 'string' && v.remarks) parts.push(`remarks: ${v.remarks}`);
  if (typeof v.fileName === 'string') parts.push(v.fileName);
  return parts.join(' · ');
}

export const ActivityLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters: the form values, and the ones actually applied
  const [person, setPerson] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({ q: '', action: '', from: '', to: '' });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchAuditLog({ page, limit: PAGE_SIZE, ...applied })
      .then((res) => {
        if (cancelled) return;
        setEntries(res.data);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setError('');
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Could not load the activity log');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, applied]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied({ q: person.trim(), action, from, to });
  };

  const resetFilters = () => {
    setPerson('');
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
    setApplied({ q: '', action: '', from: '', to: '' });
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-stone-300 rounded-xl text-sm bg-white focus:outline-none focus:border-[#063028]';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#063028] font-serif flex items-center gap-2">
          <History className="h-5 w-5 text-[#c48825]" /> Activity log
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Every sign-in, submission, approval and account change recorded by the platform, newest first.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="bg-white border border-stone-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Person (name or email)</span>
          <div className="relative">
            <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. priya or @jlu.edu.in" className={`${inputClass} pl-9`} />
          </div>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Type</span>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputClass} cursor-pointer`}>
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5 justify-end">
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button type="submit" className="px-5 py-2 rounded-xl bg-[#063028] text-white text-sm font-bold hover:bg-[#04201a] cursor-pointer">
            Apply filters
          </button>
        </div>
      </form>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Entries */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {isLoading && entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-500">Loading activity…</p>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-stone-500">No activity matches these filters.</p>
        ) : (
          <ul className={`divide-y divide-stone-100 ${isLoading ? 'opacity-60' : ''}`}>
            {entries.map((entry) => {
              const extra = details(entry);
              return (
                <li key={entry.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                  <time
                    dateTime={entry.createdAt}
                    className="text-xs font-mono text-stone-500 sm:w-40 shrink-0 sm:pt-0.5"
                  >
                    {new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-900">
                      <span className="font-bold">{entry.user?.name ?? 'Unknown user'}</span>{' '}
                      {entry.user?.role && (
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#c48825] mr-1">
                          {ROLE_LABELS[entry.user.role] ?? entry.user.role}
                        </span>
                      )}
                      <span className="text-stone-700">— {describe(entry)}</span>
                    </p>
                    {(extra || entry.user?.email) && (
                      <p className="text-xs text-stone-500 mt-0.5 break-words">
                        {[entry.user?.email, extra].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Paging */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-stone-600">
          <span>
            Page {page} of {totalPages} · {total} entries
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
