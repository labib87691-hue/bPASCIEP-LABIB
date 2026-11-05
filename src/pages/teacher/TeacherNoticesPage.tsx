/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { fetchTeacherNotices } from '../../services/teacherService';
import { NoticeItem } from '../../types/school';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await fetchTeacherNotices();
        setNotices(list);
      } catch (err) {
        console.error('Error fetching notices:', err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          n.titleEn.toLowerCase().includes(q) ||
          n.titleBn.toLowerCase().includes(q) ||
          n.summaryEn.toLowerCase().includes(q) ||
          n.summaryBn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [notices, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      <SeoHead
        title="Official Notices & Circulars | BPSC Teacher Panel"
        description="Official circulars, exam schedules, and administrative notices for faculty at BEPZA Public School and College."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#100261]" />
            <span>School Notices & Official Circulars</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional announcements, exam schedules, and academic directives.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#100261]/5 text-[#100261] border border-[#100261]/10 self-start sm:self-auto">
          {filteredNotices.length} Notices
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['all', 'academic', 'examination', 'admission', 'general'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#100261] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#100261]/20 border-t-[#100261] animate-spin" />
          </div>
        ) : filteredNotices.length > 0 ? (
          filteredNotices.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#100261] text-[#F0C94A]">
                    {n.category}
                  </span>
                  {n.isImportant && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 animate-pulse">
                      IMPORTANT
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {n.publishDate}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{n.titleEn || n.titleBn}</h3>
                {n.titleBn && n.titleEn && (
                  <p className="text-xs text-slate-600 mt-0.5">{n.titleBn}</p>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {n.detailsEn || n.summaryEn || n.detailsBn || n.summaryBn}
              </p>

              {n.attachmentUrl && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <a
                    href={n.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#100261] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View / Download Attached File</span>
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">No circulars match your current selection.</p>
          </div>
        )}
      </div>
    </div>
  );
};
