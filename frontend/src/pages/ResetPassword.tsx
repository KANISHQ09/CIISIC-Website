import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthCard } from '../components/common/AuthCard';
import { PasswordInput } from '../components/common/PasswordInput';
import { resetPassword } from '../lib/api';

const PASSWORD_RULES = 'At least 8 characters, with an uppercase letter and a number.';

/** /reset-password?token=… — set a new password from the emailed link. */
export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(`Password is too weak. ${PASSWORD_RULES}`);
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Could not reset the password. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'block w-full py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white font-medium';

  return (
    <AuthCard
      icon={<ShieldCheck className="h-8 w-8" />}
      title="Set a new password"
      subtitle="Choose a new password for your CIISIC account."
    >
      {!token ? (
        <div className="space-y-5 text-center">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 text-left flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <span>This reset link is incomplete. Please open the link from your email again, or request a new one.</span>
          </div>
          <Link to="/forgot-password" className="inline-block text-sm font-bold text-[#c48825] hover:underline">
            Request a new link
          </Link>
        </div>
      ) : done ? (
        <div className="space-y-5 text-center">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 text-left flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>Your password has been changed. You can now sign in with your new password.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-bold">
            <Link to="/industry/login" className="text-[#063028] hover:underline">Industry login</Link>
            <Link to="/institution/login" className="text-[#063028] hover:underline">Institution login</Link>
            <Link to="/admin/login" className="text-[#063028] hover:underline">CII Admin login</Link>
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm font-medium text-red-800">
              {error}{' '}
              {/invalid or has expired/i.test(error) && (
                <Link to="/forgot-password" className="font-bold underline">Request a new link</Link>
              )}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-bold text-stone-700">New password</label>
            <PasswordInput
              id="new-password"
              required
              autoComplete="new-password"
              iconSize="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputClassName={inputClass}
            />
            <p className="text-xs text-stone-500">{PASSWORD_RULES}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="block text-sm font-bold text-stone-700">Confirm new password</label>
            <PasswordInput
              id="confirm-new-password"
              required
              autoComplete="new-password"
              iconSize="md"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              inputClassName={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-base font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {isLoading ? 'Saving...' : 'Save new password'}
          </button>
        </form>
      )}
    </AuthCard>
  );
};
