/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTeacherAuth } from '../../context/TeacherAuthContext';

export const ProtectedTeacherRoute: React.FC = () => {
  const { isTeacherAuthenticated, isLoading } = useTeacherAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-3 border-[#100261]/20 border-t-[#100261] animate-spin" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Verifying Faculty Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isTeacherAuthenticated) {
    return <Navigate to="/teacher/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
