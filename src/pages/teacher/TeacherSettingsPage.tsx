/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Key,
  LogOut,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherSettingsPage: React.FC = () => {
  const { teacherProfile, currentUser, signOut } = useTeacherAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/teacher/login');
  };

  return (
    <div className="space-y-6">
      <SeoHead
        title="Faculty Account Settings | BPSC Teacher Panel"
        description="Teacher account preferences, security overview, and system guidance at BEPZA Public School and College."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#100261]" />
            <span>Faculty Account & System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Faculty credentials, security guidelines, and administrative support contacts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details & Access Role */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Authentication & Faculty Status
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Teacher ID:</span>
              <span className="font-bold text-[#100261]">{teacherProfile?.teacherId}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Registered Email:</span>
              <span className="font-medium text-slate-800">{teacherProfile?.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Firebase Auth UID:</span>
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]">
                {currentUser?.uid}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Faculty Role:</span>
              <span className="font-bold capitalize text-slate-800">
                {teacherProfile?.teacherRole?.replace('_', ' ') || 'Subject Teacher'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Account Status:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" /> Active & Verified
              </span>
            </div>
          </div>
        </div>

        {/* Security & Password Guidelines */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Password & Security Notice
          </h2>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Key className="w-4 h-4 text-[#100261]" />
              <span>Institutional Password Policy</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              To protect student marks and academic records, teacher passwords are encrypted using
              Firebase Authentication. If you need to reset or update your password, please submit a
              formal request to the ICT Department or use Google Single Sign-On.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Faculty Panel</span>
            </button>
          </div>
        </div>

        {/* Technical Support Information */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#100261]" />
            <span>Need Help or Permission Updates?</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            If you need your assigned classes modified, section additions, or marks entry permissions
            updated, please reach out to the School Administration:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">BPSC Administration Office</p>
              <p className="text-slate-500 mt-1">Ishwardi EPZ, Paksey, Pabna, Bangladesh</p>
              <p className="text-[#100261] font-semibold mt-1">bepzapublicschool@gmail.com</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">ICT & Results Helpdesk</p>
              <p className="text-slate-500 mt-1">Sunday to Thursday: 8:00 AM – 3:30 PM</p>
              <p className="text-[#100261] font-semibold mt-1">+880 1712-000000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
