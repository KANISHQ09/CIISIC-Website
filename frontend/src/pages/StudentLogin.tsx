import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowLeft, ArrowRight, Building2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

import { useSearchParams } from 'react-router-dom';

export const StudentLogin: React.FC = () => {
  const { login, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const registeredFromQuery = searchParams.get('registered') === 'true';
  const emailFromQuery = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password, 'student');
    setIsLoading(false);

    if (res.success) {
      showToast('Successfully logged in to Student Innovator Portal!', 'success');
      navigate('/student/dashboard');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#faf8f4] relative overflow-hidden">
      {/* Visual background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e0d8_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#edf4f0]/60 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-md w-full space-y-5 relative z-10 animate-fade-in">
        {/* Navigation back to Homepage */}
        <div className="flex justify-between items-center px-1">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#063028] transition-all group"
            id="back-to-home"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Homepage
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/student/register"
              className="text-xs font-bold text-[#c48825] hover:underline inline-flex items-center gap-1"
            >
              New Registration →
            </Link>
          </div>
        </div>

        {/* REGISTER FIRST BANNER */}
        <div className="bg-gradient-to-r from-[#063028] to-[#0a483d] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">New Innovator?</p>
            <p className="text-sm font-semibold text-white">Student registration is required first</p>
          </div>
          <Link
            to="/student/register"
            className="px-3.5 py-1.5 bg-[#c48825] hover:bg-[#b0781e] text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-sm shrink-0"
            id="top-register-first-btn"
          >
            Register Here
          </Link>
        </div>

        {/* Registered Success Banner if redirected from registration */}
        {registeredFromQuery && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-xs sm:text-sm font-medium text-emerald-800 leading-relaxed animate-fade-in text-left">
            <strong>Registration complete!</strong> Please enter your password to sign in to your student dashboard.
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
          {/* Top Banner / Color Accent */}
          <div className="h-2 bg-gradient-to-r from-[#063028] via-[#c48825] to-[#063028]"></div>

          <div className="p-8 sm:p-10 space-y-8">
            {/* Logo and Headings */}
            <div className="text-center space-y-3">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-[#edf4f0] text-[#063028] border border-[#063028]/15 flex items-center justify-center shadow-sm">
                <GraduationCap className="h-8 w-8 text-[#063028]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063028] tracking-tight font-serif">
                  Student Innovator Portal
                </h2>
                <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                  Explore active industry problem statements, collaborate in student innovation teams, and submit technological solutions.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm font-medium text-red-800 leading-relaxed animate-fade-in" id="login-error">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-5" onSubmit={handleSubmit} id="student-login-form">
              {/* Student Email Address */}
              <div className="space-y-2">
                <label htmlFor="student-email" className="block text-sm font-bold text-stone-700">
                  Student Email / University ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="student-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@jlu.edu.in"
                    className="block w-full pl-11 pr-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 transition-all bg-white font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="student-password" className="block text-sm font-bold text-stone-700">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Please contact your Institution SPOC or Confederation of Indian Industry (CII) Support at contact@ciisic.org to recover your password.')}
                    className="text-sm font-semibold text-[#c48825] hover:text-[#a6711c] hover:underline cursor-pointer"
                    id="forgot-password-btn"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    id="student-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full pl-11 pr-11 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 transition-all bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-stone-700 hover:text-stone-900">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[#063028] border-stone-300 rounded focus:ring-[#063028] cursor-pointer"
                    id="remember-me"
                  />
                  Remember my session
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-base font-bold text-white bg-[#063028] hover:bg-[#04201a] focus:outline-none transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-md active:scale-[0.99]"
                id="sign-in-btn"
              >
                {isLoading ? 'Verifying Student Session...' : 'Sign In to Student Portal'}
                {!isLoading && <ArrowRight className="h-5 w-5" />}
              </button>

              <div className="pt-2 text-center space-y-2">
                <p className="text-xs text-stone-600">
                  Not registered yet?{' '}
                  <Link to="/student/register" className="font-bold text-[#063028] hover:underline inline-flex items-center gap-1" id="register-link-login-footer">
                    Register as Student Innovator <ArrowRight className="h-3 w-3" />
                  </Link>
                </p>
                <p className="text-xs text-stone-500">
                  Faculty coordinator or college SPOC?{' '}
                  <Link to="/institution/login" className="font-bold text-[#c48825] hover:underline inline-flex items-center gap-1">
                    Institution Coordinator Login <ArrowRight className="h-3 w-3" />
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Portal Switchers */}
        <div className="text-center pt-4">
          <p className="text-sm text-stone-600 inline-flex items-center justify-center gap-3 flex-wrap">
            <Link 
              to="/institution/login" 
              className="font-semibold text-stone-600 hover:text-[#063028] hover:underline inline-flex items-center gap-1.5"
              id="institution-portal-link"
            >
              <Building2 className="h-4 w-4 text-[#063028]" /> Institution Login
            </Link>
            <span className="text-stone-300">•</span>
            <Link 
              to="/industry/login" 
              className="font-semibold text-stone-600 hover:text-[#063028] hover:underline inline-flex items-center gap-1.5"
              id="industry-portal-link"
            >
              <Building2 className="h-4 w-4 text-[#063028]" /> Industry Partner Login
            </Link>
            <span className="text-stone-300">•</span>
            <Link 
              to="/admin/login" 
              className="font-semibold text-[#c48825] hover:text-[#a6711c] hover:underline inline-flex items-center gap-1.5"
              id="admin-portal-link"
            >
              <ShieldCheck className="h-4 w-4 text-[#c48825]" /> CII Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
