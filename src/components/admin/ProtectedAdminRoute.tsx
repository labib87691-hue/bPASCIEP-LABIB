import React from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_ROLE_METADATA, canAccessAdminPath } from '../../utils/adminPermissions';

export const ProtectedAdminRoute: React.FC = () => {
  const { firebaseUser, adminProfile, isLoadingAuth } = useAdminAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-7 h-7 text-[#1F5FAF] animate-spin" />
        <p className="text-sm font-medium text-[#102B50]">
          Verifying administrator session & permissions...
        </p>
      </div>
    );
  }

  // Unauthenticated or non-admin users are redirected to /admin/login
  if (!firebaseUser || !adminProfile || !adminProfile.isActive) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname, needsAuthorization: Boolean(firebaseUser) }}
      />
    );
  }

  // Enforce role-based access per module route
  if (!canAccessAdminPath(adminProfile.role, location.pathname)) {
    const roleMeta = ADMIN_ROLE_METADATA[adminProfile.role];
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-[#102B50]">Module Access Restricted</h1>
            <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
              Your current role (<strong>{roleMeta.labelEn}</strong>) does not include permission to
              access <code className="text-[#102B50] font-semibold">{location.pathname}</code>.
              Contact a Super Admin if you require elevated privileges.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center justify-center min-h-[42px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold transition-colors"
            >
              Return to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
