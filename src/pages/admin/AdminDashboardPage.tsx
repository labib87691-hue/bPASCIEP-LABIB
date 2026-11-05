import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Cloud,
  FileText,
  GraduationCap,
  Inbox,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_ROLE_METADATA } from '../../utils/adminPermissions';
import { ActivityLogRecord, AdminDashboardStats } from '../../types/admin';
import { fetchLiveAdminDashboardStats } from '../../services/adminService';
import { fetchActivityLogs } from '../../services/activityLogService';
import { QrCodeGeneratorModal } from '../../components/admin/QrCodeGeneratorModal';

export const AdminDashboardPage: React.FC = () => {
  const { adminProfile, can } = useAdminAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [qrOpen, setQrOpen] = useState<boolean>(false);

  const loadDashboard = async () => {
    if (!adminProfile) return;
    setLoading(true);
    try {
      const [liveStats, logs] = await Promise.all([
        fetchLiveAdminDashboardStats(),
        fetchActivityLogs(adminProfile.role, 8),
      ]);
      setStats(liveStats);
      setRecentLogs(logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [adminProfile?.uid]);

  const roleMeta = adminProfile ? ADMIN_ROLE_METADATA[adminProfile.role] : null;

  const statCards = [
    {
      label: 'Total Active Students',
      value: stats?.totalStudents ?? 0,
      sub: 'Registered in Student Directory',
      to: '/admin/students',
      icon: GraduationCap,
      perm: 'manage_students' as const,
    },
    {
      label: 'Total Active Teachers',
      value: stats?.totalTeachers ?? 0,
      sub: 'Faculty profiles on public site',
      to: '/admin/teachers',
      icon: Users,
      perm: 'manage_teachers' as const,
    },
    {
      label: 'Published Cloud Documents',
      value: stats?.publishedCloudDocs ?? 0,
      sub: `${stats?.draftCloudDocs ?? 0} unpublished drafts`,
      to: '/admin/cloud',
      icon: Cloud,
      perm: 'manage_cloud' as const,
    },
    {
      label: 'Published Results',
      value: stats?.publishedResults ?? 0,
      sub: `${stats?.pendingResultApprovals ?? 0} awaiting approval`,
      to: '/admin/results',
      icon: BarChart3,
      perm: 'manage_results' as const,
    },
    {
      label: 'Published Notices',
      value: stats?.publishedNotices ?? 0,
      sub: 'Official circulars & orders',
      to: '/admin/notices',
      icon: FileText,
      perm: 'manage_notices' as const,
    },
    {
      label: 'Pending Result Approvals',
      value: stats?.pendingResultApprovals ?? 0,
      sub: 'Submitted mark sheets for review',
      to: '/admin/results',
      icon: BarChart3,
      perm: 'approve_publish_results' as const,
    },
    {
      label: 'Pending Teacher Approvals',
      value: stats?.pendingTeacherApprovals ?? 0,
      sub: 'Phase 5 teacher portal requests',
      to: '/admin/teacher-access',
      icon: UserCheck,
      perm: 'manage_teacher_access' as const,
    },
    {
      label: 'Unread Contact Messages',
      value: stats?.unreadContactMessages ?? 0,
      sub: 'Public website inquiries',
      to: '/admin/contact-messages',
      icon: Inbox,
      perm: 'manage_contact_messages' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#1F5FAF]">
            BEPZA Public School & College · Ishwardi EPZ (EIIN: 140336)
          </p>
          <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-[#102B50]">
            Welcome, {adminProfile?.displayName || 'Administrator'}
          </h2>
          {roleMeta && (
            <p className="mt-1 text-xs sm:text-sm text-[#617187]">
              Active Role: <strong className="text-[#102B50]">{roleMeta.labelEn}</strong> —{' '}
              {roleMeta.descriptionEn}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] bg-[#F6F8FC] text-xs font-semibold text-[#102B50] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Counts</span>
        </button>
      </div>

      {/* Real Institutional KPI Cards */}
      {loading && !stats ? (
        <div className="bg-white rounded-xl border border-slate-200 py-14 flex flex-col items-center justify-center gap-2.5">
          <Loader2 className="w-6 h-6 text-[#1F5FAF] animate-spin" />
          <span className="text-xs font-medium text-[#617187]">
            Querying live Firestore collections...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const permitted = can(card.perm);
            const inner = (
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between h-full hover:border-[#1F5FAF]/45 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-[#617187]">{card.label}</div>
                    <div className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#102B50] tabular-nums">
                      {card.value}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-[#102B50]/[0.07] text-[#102B50] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#617187]">
                  <span className="truncate">{card.sub}</span>
                  {permitted && <ArrowRight className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />}
                </div>
              </div>
            );

            return permitted ? (
              <Link key={card.label} to={card.to} className="block h-full">
                {inner}
              </Link>
            ) : (
              <div key={card.label} className="h-full opacity-80">
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quick Actions */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#102B50]">Quick Actions</h3>
            <p className="text-xs text-[#617187] mt-0.5">
              Direct shortcuts to frequent institutional operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {can('manage_cloud') && (
              <Link
                to="/admin/cloud?action=new"
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4 text-[#17A9C6] shrink-0" />
                <span>Add Cloud Document</span>
              </Link>
            )}

            {can('manage_notices') && (
              <Link
                to="/admin/notices?action=new"
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold transition-colors"
              >
                <FileText className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                <span>Create Notice</span>
              </Link>
            )}

            {can('manage_results') && (
              <Link
                to="/admin/results"
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                <span>Manage Results</span>
              </Link>
            )}

            {can('manage_teachers') && (
              <Link
                to="/admin/teachers?action=new"
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold transition-colors"
              >
                <Users className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                <span>Add Teacher</span>
              </Link>
            )}

            {can('manage_holidays') && (
              <Link
                to="/admin/holidays?action=new"
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold transition-colors"
              >
                <CalendarDays className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                <span>Add Holiday</span>
              </Link>
            )}

            {can('generate_qr') && (
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold transition-colors text-left"
              >
                <QrCode className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                <span>Generate QR Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1F5FAF]" />
              <h3 className="text-sm sm:text-base font-bold text-[#102B50]">
                Recent Administrative Activity
              </h3>
            </div>
            <Link
              to="/admin/activity-logs"
              className="text-xs font-semibold text-[#1F5FAF] hover:underline"
            >
              View Full Audit Log
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#617187] bg-[#F6F8FC] rounded-lg border border-slate-100">
              No administrative actions logged yet in this session.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#17263C] truncate">{log.summary}</div>
                    <div className="text-[11px] text-[#617187] truncate">
                      {log.actorEmail} · <span className="font-medium">{log.actionType}</span>
                    </div>
                  </div>
                  <time className="text-[11px] text-[#617187] tabular-nums shrink-0">
                    {new Date(log.createdAtIso).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QrCodeGeneratorModal isOpen={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
};
