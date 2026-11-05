import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import {
  AdminRole,
  AdminUserProfile,
  SchoolOperationalSettings,
} from '../../types/admin';
import { SiteSetting } from '../../types/school';
import { ADMIN_ROLE_METADATA } from '../../utils/adminPermissions';
import {
  DEFAULT_OPERATIONAL_SETTINGS,
  fetchAllAdminUsers,
  fetchOperationalSettings,
  fetchSiteSettingsForAdmin,
  saveOperationalSettings,
  saveSiteSettings,
  upsertAdminUserRole,
} from '../../services/adminService';
import { QrCodeGeneratorModal } from '../../components/admin/QrCodeGeneratorModal';

export const AdminSettingsPage: React.FC = () => {
  const { adminProfile, can, refreshAdminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();
  const isSuperAdmin = can('manage_admin_roles');

  const [tab, setTab] = useState<'branding' | 'operational' | 'roles'>('branding');
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [opSetting, setOpSetting] = useState<SchoolOperationalSettings>(
    DEFAULT_OPERATIONAL_SETTINGS
  );
  const [adminUsers, setAdminUsers] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [confirmSaveOpen, setConfirmSaveOpen] = useState<'branding' | 'operational' | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  const [roleForm, setRoleForm] = useState<{
    uid: string;
    email: string;
    displayName: string;
    role: AdminRole;
    isActive: boolean;
  } | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [site, op, admins] = await Promise.all([
        fetchSiteSettingsForAdmin(),
        fetchOperationalSettings(),
        fetchAllAdminUsers().catch(() => []),
      ]);
      setSiteSetting(site);
      setOpSetting(op);
      setAdminUsers(admins);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load school settings.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleConfirmSaveBranding = async () => {
    if (!adminProfile || !siteSetting) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveSiteSettings(siteSetting, adminProfile.role);
      setConfirmSaveOpen(null);
      setFeedback({
        type: 'success',
        message: 'Saved institutional branding, EIIN, and contact settings.',
      });
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save branding settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSaveOperational = async () => {
    if (!adminProfile) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveOperationalSettings(
        {
          currentAcademicYear: opSetting.currentAcademicYear,
          admissionOpen: opSetting.admissionOpen,
          resultPortalEnabled: opSetting.resultPortalEnabled,
          defaultShowPositionInResults: opSetting.defaultShowPositionInResults,
          requireResultApprovalBeforePublish: opSetting.requireResultApprovalBeforePublish,
          cloudCenterEnabled: opSetting.cloudCenterEnabled,
          cloudItemsPerPage: opSetting.cloudItemsPerPage,
          maintenanceBannerTextEn: opSetting.maintenanceBannerTextEn,
          maintenanceBannerTextBn: opSetting.maintenanceBannerTextBn,
        },
        adminProfile.role
      );
      setConfirmSaveOpen(null);
      setFeedback({
        type: 'success',
        message: 'Saved operational portal & academic year preferences.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save operational preferences.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdminRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !roleForm) return;
    setSaving(true);
    setFeedback(null);
    try {
      await upsertAdminUserRole(
        roleForm.uid,
        {
          email: roleForm.email,
          displayName: roleForm.displayName,
          role: roleForm.role,
          isActive: roleForm.isActive,
        },
        adminProfile.role
      );
      setRoleForm(null);
      setFeedback({
        type: 'success',
        message: `Updated administrator role for ${roleForm.email}.`,
      });
      await loadSettings();
      await refreshAdminProfile();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update administrator role.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102B50]">
            School Branding, Operational Settings & Role Governance
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Configure BPSC institutional details, Result/Cloud preferences, QR codes, and RBAC
            administrators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
          >
            <QrCode className="w-4 h-4 text-[#1F5FAF]" />
            <span>QR Generator</span>
          </button>

          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('branding')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 ${
            tab === 'branding'
              ? 'border-[#1F5FAF] text-[#102B50]'
              : 'border-transparent text-[#617187]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>School Branding & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('operational')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 ${
            tab === 'operational'
              ? 'border-[#1F5FAF] text-[#102B50]'
              : 'border-transparent text-[#617187]'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>Portal & Academic Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('roles')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 ${
            tab === 'roles'
              ? 'border-[#1F5FAF] text-[#102B50]'
              : 'border-transparent text-[#617187]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Administrator Roles (RBAC)</span>
        </button>
      </div>

      {/* TAB 1: BRANDING */}
      {tab === 'branding' && siteSetting && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                School Name (English)
              </label>
              <input
                type="text"
                value={siteSetting.schoolNameEn}
                onChange={(e) => setSiteSetting({ ...siteSetting, schoolNameEn: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                School Name (Bengali)
              </label>
              <input
                type="text"
                value={siteSetting.schoolNameBn}
                onChange={(e) => setSiteSetting({ ...siteSetting, schoolNameBn: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">EIIN</label>
              <input
                type="text"
                value={siteSetting.eiin}
                onChange={(e) => setSiteSetting({ ...siteSetting, eiin: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Established Year
              </label>
              <input
                type="text"
                value={siteSetting.establishedYear}
                onChange={(e) =>
                  setSiteSetting({ ...siteSetting, establishedYear: e.target.value })
                }
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Primary Phone
              </label>
              <input
                type="text"
                value={siteSetting.phonePrimary}
                onChange={(e) => setSiteSetting({ ...siteSetting, phonePrimary: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={siteSetting.emailPrimary}
                onChange={(e) => setSiteSetting({ ...siteSetting, emailPrimary: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Campus Address (English)
              </label>
              <input
                type="text"
                value={siteSetting.addressEn}
                onChange={(e) => setSiteSetting({ ...siteSetting, addressEn: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Official Logo URL (Optional Override)
              </label>
              <input
                type="text"
                value={siteSetting.logoUrl || ''}
                onChange={(e) => setSiteSetting({ ...siteSetting, logoUrl: e.target.value })}
                placeholder="/images/logo.png or https://..."
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Official Facebook URL
              </label>
              <input
                type="text"
                value={siteSetting.facebookUrl}
                onChange={(e) => setSiteSetting({ ...siteSetting, facebookUrl: e.target.value })}
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmSaveOpen('branding')}
              className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>Save Branding & Contact Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIONAL PREFERENCES */}
      {tab === 'operational' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Active Academic Year
              </label>
              <input
                type="text"
                value={opSetting.currentAcademicYear}
                onChange={(e) =>
                  setOpSetting({ ...opSetting, currentAcademicYear: e.target.value })
                }
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                BPSC Cloud Items Per Page
              </label>
              <input
                type="number"
                min={6}
                max={48}
                value={opSetting.cloudItemsPerPage}
                onChange={(e) =>
                  setOpSetting({ ...opSetting, cloudItemsPerPage: Number(e.target.value) })
                }
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-[#102B50]">
            <label className="inline-flex items-center gap-2.5 p-3 rounded-lg bg-[#F6F8FC] border border-slate-200">
              <input
                type="checkbox"
                checked={opSetting.admissionOpen}
                onChange={(e) => setOpSetting({ ...opSetting, admissionOpen: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span>Admission Inquiries & Applications Open</span>
            </label>
            <label className="inline-flex items-center gap-2.5 p-3 rounded-lg bg-[#F6F8FC] border border-slate-200">
              <input
                type="checkbox"
                checked={opSetting.resultPortalEnabled}
                onChange={(e) =>
                  setOpSetting({ ...opSetting, resultPortalEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span>Public Result Portal (/result) Enabled</span>
            </label>
            <label className="inline-flex items-center gap-2.5 p-3 rounded-lg bg-[#F6F8FC] border border-slate-200">
              <input
                type="checkbox"
                checked={opSetting.requireResultApprovalBeforePublish}
                onChange={(e) =>
                  setOpSetting({
                    ...opSetting,
                    requireResultApprovalBeforePublish: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span>Require Admin Approval Before Result Publication</span>
            </label>
            <label className="inline-flex items-center gap-2.5 p-3 rounded-lg bg-[#F6F8FC] border border-slate-200">
              <input
                type="checkbox"
                checked={opSetting.cloudCenterEnabled}
                onChange={(e) =>
                  setOpSetting({ ...opSetting, cloudCenterEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span>BPSC Cloud Document Center (/cloud) Enabled</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setConfirmSaveOpen('operational')}
              className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>Save Operational Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ADMINISTRATOR ROLES (SUPER ADMIN ONLY FOR MUTATION) */}
      {tab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#617187]">
              {isSuperAdmin ? (
                <span>
                  Signed in as <strong className="text-[#102B50]">Super Admin</strong>. You can
                  grant or modify roles across all 5 RBAC tiers.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  Only a Super Admin can modify administrator role assignments.
                </span>
              )}
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() =>
                  setRoleForm({
                    uid: '',
                    email: '',
                    displayName: '',
                    role: 'admin',
                    isActive: true,
                  })
                }
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Admin Role by UID</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Firebase UID</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Status</th>
                    {isSuperAdmin && <th className="py-3 px-4 text-right">Manage</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {adminUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#102B50]">{u.displayName}</div>
                        <div className="text-xs text-[#617187]">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#617187]">{u.uid}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded bg-[#102B50]/[0.08] text-[#102B50] text-xs font-bold">
                          {ADMIN_ROLE_METADATA[u.role]?.labelEn || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setRoleForm({
                                uid: u.uid,
                                email: u.email,
                                displayName: u.displayName,
                                role: u.role,
                                isActive: u.isActive,
                              })
                            }
                            className="px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                          >
                            Edit Role
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Critical Settings Confirmation Dialog */}
      {confirmSaveOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setConfirmSaveOpen(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Confirm Institutional Settings</h3>
            <p className="text-xs text-[#617187]">
              Apply these {confirmSaveOpen === 'branding' ? 'branding & contact' : 'operational'}{' '}
              changes across the live BPSC platform and record an immutable audit entry?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={
                  confirmSaveOpen === 'branding'
                    ? handleConfirmSaveBranding
                    : handleConfirmSaveOperational
                }
                className="px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Applying...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Role Modal */}
      {roleForm && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setRoleForm(null)}
        >
          <form
            onSubmit={handleSaveAdminRole}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">Assign Administrator Role</h3>
              <button type="button" onClick={() => setRoleForm(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Firebase Auth User UID *
                </label>
                <input
                  type="text"
                  required
                  value={roleForm.uid}
                  onChange={(e) => setRoleForm({ ...roleForm, uid: e.target.value })}
                  placeholder="User's Firebase Authentication UID"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={roleForm.email}
                  onChange={(e) => setRoleForm({ ...roleForm, email: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Role *</label>
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value as AdminRole })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {Object.values(ADMIN_ROLE_METADATA).map((meta) => (
                    <option key={meta.role} value={meta.role}>
                      {meta.labelEn}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#617187] mt-1">
                  {ADMIN_ROLE_METADATA[roleForm.role]?.descriptionEn}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                <input
                  type="checkbox"
                  checked={roleForm.isActive}
                  onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span>Administrator Account Active</span>
              </label>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRoleForm(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                Save Role Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      <QrCodeGeneratorModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
};
