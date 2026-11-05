import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { SeoHead } from '../../components/common/SeoHead';

export const AdminLoginPage: React.FC = () => {
  const {
    firebaseUser,
    adminProfile,
    isLoadingAuth,
    authError,
    clearAuthError,
    loginWithEmailPassword,
    loginWithGoogle,
    requestPasswordReset,
    provisionInitialSuperAdmin,
    logoutAdmin,
  } = useAdminAuth();

  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const redirectTarget =
    state?.from && state.from.startsWith('/admin') && state.from !== '/admin/login'
      ? state.from
      : '/admin/dashboard';

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<boolean>(false);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-7 h-7 text-[#1F5FAF] animate-spin" />
        <p className="text-sm font-medium text-[#102B50]">Checking administrator session...</p>
      </div>
    );
  }

  // Authenticated & authorized active admin -> enter Master Admin Panel
  if (firebaseUser && adminProfile && adminProfile.isActive) {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    setResetSent(false);

    if (!email.trim()) {
      setLocalError('Please enter your administrator email address.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'reset') {
        await requestPasswordReset(email);
        setResetSent(true);
      } else {
        if (!password) {
          setLocalError('Please enter your password.');
          setBusy(false);
          return;
        }
        await loginWithEmailPassword(email, password);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setLocalError(null);
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleBootstrapSuperAdmin = async () => {
    clearAuthError();
    setLocalError(null);
    setBusy(true);
    try {
      await provisionInitialSuperAdmin(
        displayName.trim() || firebaseUser?.displayName || undefined
      );
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Super Admin provisioning declined.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopyUid = async () => {
    if (!firebaseUser) return;
    try {
      await navigator.clipboard.writeText(firebaseUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const effectiveError = localError || authError;

  return (
    <>
      <SeoHead
        title="Master Admin Sign-In — BPSC Ishwardi EPZ"
        description="Restricted administrative sign-in portal for BEPZA Public School & College, Ishwardi EPZ."
      />

      <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-7xl w-full mx-auto pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Website</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#102B50] px-6 py-6 text-white flex items-center gap-3.5">
            <img
              src="/assets/branding/logo.jpeg"
              alt="BPSC Official Crest"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover border-2 border-white/25 bg-white shrink-0"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#17A9C6] tracking-wide">
                EIIN: 140336 · ISHWARDI EPZ
              </div>
              <h1 className="text-base sm:text-lg font-bold leading-snug">
                BPSC Master Admin Panel
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Authorized institutional personnel only
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {effectiveError && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{effectiveError}</span>
              </div>
            )}

            {resetSent && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  If an administrator account exists for <strong>{email}</strong>, a password reset
                  link has been sent.
                </span>
              </div>
            )}

            {/* Case A: User authenticated in Firebase Auth, but has no active adminUsers record */}
            {firebaseUser && (!adminProfile || !adminProfile.isActive) ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F6F8FC] border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#102B50]">
                    <ShieldCheck className="w-4 h-4 text-[#1F5FAF]" />
                    <span>Signed In — Role Verification Required</span>
                  </div>
                  <p className="text-xs text-[#617187] leading-relaxed">
                    Account <strong>{firebaseUser.email}</strong> is signed in, but no active
                    administrator role was found in <code className="text-[#102B50]">adminUsers</code>.
                  </p>
                  <div className="pt-1 flex items-center justify-between gap-2 text-[11px] bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className="truncate tabular-nums text-[#17263C]">
                      UID: <strong>{firebaseUser.uid}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUid}
                      className="inline-flex items-center gap-1 font-semibold text-[#1F5FAF] shrink-0"
                    >
                      {copiedUid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUid ? 'Copied' : 'Copy UID'}</span>
                    </button>
                  </div>
                </div>

                {/* One-Time / Verified Owner Super Admin Setup */}
                <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                  <h2 className="text-xs font-bold text-[#102B50]">
                    Initial Super Admin Provisioning
                  </h2>
                  <p className="text-xs text-[#617187] leading-relaxed">
                    If you are the verified institutional owner setting up BPSC Master Admin for the
                    first time, verify your token with the server to activate your{' '}
                    <strong>Super Admin</strong> role. Secondary staff must share their UID above
                    with an existing Super Admin.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#102B50] mb-1">
                      Administrator Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={firebaseUser.displayName || 'Principal / Super Administrator'}
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] focus:border-[#1F5FAF] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleBootstrapSuperAdmin}
                    className="w-full min-h-[42px] px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Verify & Activate Super Admin Access</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void logoutAdmin()}
                  className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#617187] flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of {firebaseUser.email}</span>
                </button>
              </div>
            ) : (
              /* Case B: Unauthenticated Sign-In / Password Reset Form */
              <>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-xs font-semibold text-[#102B50] mb-1.5"
                    >
                      Official Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#617187] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@bpsciepz.edu.bd"
                        className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] focus:border-[#1F5FAF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="admin-password"
                          className="block text-xs font-semibold text-[#102B50]"
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('reset');
                            setLocalError(null);
                            clearAuthError();
                          }}
                          className="text-xs font-medium text-[#1F5FAF] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#617187] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="admin-password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] focus:border-[#1F5FAF] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : mode === 'login' ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>
                      {mode === 'login' ? 'Sign In with Email & Password' : 'Send Password Reset Link'}
                    </span>
                  </button>
                </form>

                {mode === 'reset' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setResetSent(false);
                      setLocalError(null);
                    }}
                    className="w-full text-center text-xs font-semibold text-[#1F5FAF] hover:underline"
                  >
                    Return to Email & Password Sign-In
                  </button>
                ) : (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-[11px]">
                        <span className="bg-white px-2.5 text-[#617187]">
                          OR VERIFIED INSTITUTIONAL ACCOUNT
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleGoogleSignIn}
                      className="w-full min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:bg-slate-100 disabled:opacity-60 text-xs sm:text-sm font-semibold text-[#102B50] flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1F5FAF]" />
                      <span>Continue with Verified Google Account</span>
                    </button>
                  </>
                )}

                <p className="text-[11px] text-[#617187] text-center leading-relaxed pt-1">
                  Public registration is disabled. Administrator accounts must be authorized in
                  Firebase Authentication and assigned an active role by a Super Admin.
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#617187] pb-2">
          © {new Date().getFullYear()} BEPZA Public School & College, Ishwardi EPZ
        </p>
      </div>
    </>
  );
};
