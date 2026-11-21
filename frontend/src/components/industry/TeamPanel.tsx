import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Link2, Mail, Trash2, User, UserPlus, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  addTeamMember,
  createTeamMemberLink,
  fetchIndustryTeam,
  removeTeamMember,
  type IndustryTeam,
  type IndustryTeamMember,
} from '../../lib/api';

const inputClass =
  'block w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm text-stone-900 bg-white focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10';

const StatusLabel: React.FC<{ member: IndustryTeamMember }> = ({ member }) => {
  if (member.isMain) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#edf4f0] text-[#063028]">Main account</span>;
  }
  if (member.status === 'INVITED') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Awaiting password</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">Member</span>;
};

/** Lets a company give each colleague their own login to the same dashboard. */
export const TeamPanel: React.FC = () => {
  const { showToast } = useApp();
  const [team, setTeam] = useState<IndustryTeam | null>(null);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<{ name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      setTeam(await fetchIndustryTeam());
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.message || 'Could not load your team.');
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const showLink = (memberName: string, url: string) => {
    setCopied(false);
    setShareLink({ name: memberName, url });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (name.trim().length < 2) {
      setFormError('Please enter the full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid work email.');
      return;
    }
    setIsSaving(true);
    try {
      const { member, setupUrl } = await addTeamMember(name.trim(), email.trim());
      showLink(member.name, setupUrl);
      setName('');
      setEmail('');
      await loadTeam();
      showToast('Team member added. Share their link to finish.', 'success');
    } catch (err: any) {
      setFormError(err.message || 'Could not add this team member.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewLink = async (member: IndustryTeamMember) => {
    setBusyId(member.id);
    try {
      showLink(member.name, await createTeamMemberLink(member.id));
    } catch (err: any) {
      showToast(err.message || 'Could not create a new link.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (member: IndustryTeamMember) => {
    setBusyId(member.id);
    try {
      await removeTeamMember(member.id);
      setConfirmRemoveId(null);
      setShareLink(null);
      await loadTeam();
      showToast(`${member.name} no longer has access.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not remove this team member.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
    } catch {
      showToast('Could not copy automatically. Please select the link and copy it.', 'error');
    }
  };

  if (loadError) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 text-sm text-red-700" role="alert">
        {loadError}{' '}
        <button onClick={loadTeam} className="font-bold underline cursor-pointer">Try again</button>
      </div>
    );
  }
  if (!team) {
    return <div className="bg-white rounded-2xl border border-stone-200 p-6 text-sm text-stone-500">Loading your team...</div>;
  }

  const memberCount = team.members.length - 1;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[#063028] flex items-center gap-2">
          <Users className="h-5 w-5 text-[#c48825]" aria-hidden="true" />
          {team.companyName} team
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Everyone here signs in with their own email and password and sees this same company dashboard.
        </p>

        {team.canManage ? (
          <form onSubmit={handleAdd} className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end" noValidate>
            <div>
              <label htmlFor="team-name" className="block text-sm font-bold text-stone-700 mb-1.5">Full name</label>
              <input id="team-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="off" className={inputClass} />
            </div>
            <div>
              <label htmlFor="team-email" className="block text-sm font-bold text-stone-700 mb-1.5">Work email</label>
              <input id="team-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={isSaving || memberCount >= team.maxMembers}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {isSaving ? 'Adding...' : 'Add member'}
            </button>
            {formError && <p role="alert" className="md:col-span-3 text-sm text-red-600">{formError}</p>}
          </form>
        ) : (
          <p className="mt-4 text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-xl p-3">
            Only your company's main account can add or remove team members.
          </p>
        )}

        {shareLink && (
          <div className="mt-5 rounded-xl border border-[#063028]/20 bg-[#edf4f0] p-4">
            <p className="text-sm font-bold text-[#063028]">Share this link with {shareLink.name}</p>
            <p className="text-xs text-stone-600 mt-0.5">
              They use it once to set a password. It expires in 7 days, so share it only with this person.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                aria-label={`Set-password link for ${shareLink.name}`}
                value={shareLink.url}
                onFocus={(e) => e.target.select()}
                className={`${inputClass} font-mono text-xs min-w-0`}
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-[#063028] bg-white border border-[#063028]/30 hover:bg-stone-50 cursor-pointer shrink-0"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ul className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
        {team.members.map((member) => (
          <li key={member.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="h-9 w-9 rounded-full bg-[#edf4f0] text-[#063028] flex items-center justify-center shrink-0">
                <User className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-stone-900">{member.name}</span>
                  <StatusLabel member={member} />
                </div>
                <span className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 min-w-0">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{member.email}</span>
                </span>
              </div>
            </div>

            {team.canManage && !member.isMain && (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {confirmRemoveId === member.id ? (
                  <>
                    <span className="text-xs font-medium text-stone-600">Remove access?</span>
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={busyId === member.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                    >
                      Yes, remove
                    </button>
                    <button
                      onClick={() => setConfirmRemoveId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-700 border border-stone-300 hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {member.status === 'INVITED' && (
                      <button
                        onClick={() => handleNewLink(member)}
                        disabled={busyId === member.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#063028] border border-stone-300 hover:bg-stone-50 disabled:opacity-50 cursor-pointer"
                      >
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                        New link
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmRemoveId(member.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 border border-red-200 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
