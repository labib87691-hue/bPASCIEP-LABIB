import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ActivityLogRecord } from '../../types/admin';
import { fetchActivityLogs } from '../../services/activityLogService';

export const AdminActivityLogsPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchActivityLogs(adminProfile?.role || 'admin', 120);
      setLogs(list);
    } finally {
      setLoading(false);
    }
  }, [adminProfile?.role]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const distinctActions = useMemo(() => {
    const set = new Set<string>(logs.map((l) => l.actionType));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter !== 'ALL' && l.actionType !== actionFilter) return false;
      if (!q) return true;
      return (
        l.summary.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.targetCollection.toLowerCase().includes(q) ||
        l.actionType.toLowerCase().includes(q)
      );
    });
  }, [logs, actionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102B50]">
            Immutable Administrative Activity Logs
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Append-only audit trail protected by Firestore Security Rules (no updates or deletions
            permitted; zero credentials stored)
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Security Banner */}
      <div className="bg-[#F6F8FC] rounded-xl border border-slate-200 p-4 flex items-center gap-3 text-xs text-[#17263C]">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          Audit records capture login/logout events, Cloud publications, result approvals, student
          imports, teacher authorizations, and settings updates. Passwords, tokens, and secrets are
          automatically stripped before persistence.
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="ALL">All Action Types ({logs.length})</option>
          {distinctActions.map((act) => (
            <option key={act} value={act}>
              {act.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <div className="relative flex-1 sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor email, summary, collection..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <History className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-[#102B50]">No activity logs recorded yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 tabular-nums text-xs text-[#617187] whitespace-nowrap">
                      {new Date(log.createdAtIso).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-[#102B50]">{log.actorEmail}</div>
                      <div className="text-[11px] text-[#617187] uppercase">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#102B50]/[0.07] text-[#102B50] text-xs font-mono font-semibold">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-[#617187]">
                      {log.targetCollection}/{log.targetId}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#17263C]">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
