/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherLoginPage: React.FC = () => {
  const { signInWithEmail, signInWithGoogle, isTeacherAuthenticated } = useTeacherAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/teacher/dashboard';

  React.useEffect(() => {
    if (isTeacherAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isTeacherAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErrorMsg('Invalid email or password. Please re-check your faculty credentials.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0147] via-[#100261] to-[#142863] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SeoHead
        title="Teacher Portal Login | BEPZA Public School and College"
        description="Secure faculty portal for BEPZA Public School and College, Ishwardi EPZ teachers to manage classes, enter marks, and record attendance."
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Crest & Header */}
        <div className="text-center">
          <Link to="/" className="inline-block group mb-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-white p-1 shadow-lg ring-4 ring-[#F0C94A]/30">
              <img
                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80"
                alt="BPSC Logo"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0C94A] text-[#100261] mb-2 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            BPSC FACULTY ACCESS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Teacher Portal Login
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            BEPZA Public School and College, Ishwardi EPZ
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-6 bg-white py-8 px-5 sm:px-8 shadow-2xl rounded-2xl border border-slate-100">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@bpsc.edu.bd"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#100261] focus:border-[#100261]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#100261] focus:border-[#100261]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-[#100261] hover:bg-[#142863] text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <span>Sign In to Teacher Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">or sign in with Google</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full mt-4 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with School Google Account</span>
            </button>
          </div>

          {/* Institutional Provisioning Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-[#F6F8FC] -mx-5 -mb-8 p-5 rounded-b-2xl">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#100261] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Faculty Provisioning Policy:</span> Teacher
                accounts are assigned strictly by authorized School Administrators. Self-registration is
                disabled. If you need access, please contact the Principal&apos;s office or ICT Department.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <Link to="/" className="text-[#100261] hover:underline font-medium">
                ← Back to Main Website
              </Link>
              <Link to="/admin/login" className="text-slate-500 hover:text-slate-800 font-medium">
                Administrator Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
