import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, CheckCircle2 } from 'lucide-react';
import { AuthCard } from '../components/common/AuthCard';
import { requestPasswordReset } from '../lib/api';

/** /forgot-password — ask for a password reset link by email (all account types). */
export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (err: any) {
      setError(err.message || 'Could not send the reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      icon={<KeyRound className="h-8 w-8" />}
      title="Forgot your password?"
      subtitle="Enter the email address you sign in with and we'll send you a link to set a new password."
    >
      {sentTo ? (
        <div className="space-y-5 text-center">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 text-left flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              If an account exists for <strong className="break-all">{sentTo}</strong>, a password reset link is on its way.
              The link works for 1 hour. Check your spam folder if it doesn't arrive.
            </span>
          </div>
          <Link to="/" className="inline-block text-sm font-bold text-[#c48825] hover:underline">
            Back to homepage
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm font-medium text-red-800">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-bold text-stone-700">
              Email address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organisation.com"
                className="block w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white font-medium"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-base font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
};
