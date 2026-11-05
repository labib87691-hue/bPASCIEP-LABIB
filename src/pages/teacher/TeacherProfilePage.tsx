/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { updateTeacherSelfProfile } from '../../services/teacherService';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherProfilePage: React.FC = () => {
  const { teacherProfile, refreshProfile, canTeacher } = useTeacherAuth();
  const [phone, setPhone] = useState(teacherProfile?.phone || '');
  const [photoUrl, setPhotoUrl] = useState(teacherProfile?.photoUrl || '');
  const [bio, setBio] = useState(teacherProfile?.bio || '');
  const [officeHours, setOfficeHours] = useState(teacherProfile?.officeHours || '');
  const [qualification, setQualification] = useState(teacherProfile?.qualification || '');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canEdit = canTeacher('edit_profile');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherProfile) return;
    if (!canEdit) {
      setErrorMsg('Profile self-editing permission is restricted by administration.');
      return;
    }
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateTeacherSelfProfile(teacherProfile.uid, {
        phone,
        photoUrl,
        bio,
        officeHours,
        qualification,
      });
      await refreshProfile();
      setSuccessMsg('Your faculty profile details have been saved successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SeoHead
        title="My Faculty Profile | BPSC Teacher Panel"
        description="View and update faculty details, office hours, and credentials for BEPZA Public School and College."
      />

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#100261] border-2 border-[#F0C94A] shrink-0 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Teacher" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-[#F0C94A]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {teacherProfile?.fullName}
              </h1>
              <span className="text-[10px] font-bold bg-[#100261] text-[#F0C94A] px-2 py-0.5 rounded">
                ID: {teacherProfile?.teacherId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {teacherProfile?.designation || 'Faculty Member'} • {teacherProfile?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Active Faculty Account
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Read-Only Institutional Assignment */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Institutional Assignment
            </h2>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">Teacher Role</label>
              <p className="text-xs font-bold text-slate-800 capitalize mt-0.5">
                {teacherProfile?.teacherRole?.replace('_', ' ') || 'Subject Teacher'}
                {teacherProfile?.isClassTeacher && ` (Class Teacher of ${teacherProfile.classTeacherOf || 'Assigned'})`}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">Assigned Classes</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {teacherProfile?.assignedClasses?.length ? (
                  teacherProfile.assignedClasses.map((cls) => (
                    <span
                      key={cls}
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-[#100261]"
                    >
                      {cls}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None assigned</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">Assigned Sections</label>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                {teacherProfile?.assignedSections?.join(', ') || 'All Sections'}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">Assigned Subjects</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {teacherProfile?.assignedSubjects?.length ? (
                  teacherProfile.assignedSubjects.map((sub) => (
                    <span
                      key={sub}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                    >
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None assigned</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-500">Active Permissions</label>
              <ul className="mt-1 space-y-1 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enter Marks & Drafts: {teacherProfile?.canEnterMarks ? 'Yes' : 'No'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Submit Results: {teacherProfile?.canSubmitResults ? 'Yes' : 'No'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Take Attendance: {teacherProfile?.canTakeAttendance ? 'Yes' : 'No'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View Students: {teacherProfile?.canViewStudents ? 'Yes' : 'No'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Fields Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personal & Contact Information
              </h2>
              {!canEdit && (
                <span className="text-[11px] text-amber-600 font-medium">Read-Only Mode</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    disabled={!canEdit}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profile Photo URL
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Office Hours / Consultation Schedule
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  placeholder="Sun-Thu: 1:30 PM - 2:30 PM (Faculty Room 204)"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Qualifications
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled={!canEdit}
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="M.Sc in Physics (Rajshahi University), B.Ed"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Bio / Teaching Philosophy
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief introduction, research interests, or message to students and guardians..."
                className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none disabled:bg-slate-50"
              />
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2 px-5 bg-[#100261] hover:bg-[#142863] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
