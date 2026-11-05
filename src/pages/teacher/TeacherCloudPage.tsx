/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Cloud,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { fetchTeacherCloudDocuments } from '../../services/teacherService';
import { CloudDocumentRecord } from '../../types/cloud';
import { SeoHead } from '../../components/common/SeoHead';

const CATEGORIES = [
  'All',
  'Class Routine',
  'Exam Routine',
  'Syllabus',
  'Academic Calendar',
  'Holiday List',
  'Question Papers',
  'Study Materials',
];

export const TeacherCloudPage: React.FC = () => {
  const { teacherProfile } = useTeacherAuth();
  const [documents, setDocuments] = useState<CloudDocumentRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const docs = await fetchTeacherCloudDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Error fetching cloud docs:', err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
      if (selectedClass !== 'All' && d.className !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.subject ? d.subject.toLowerCase().includes(q) : false)
        );
      }
      return true;
    });
  }, [documents, selectedCategory, selectedClass, searchQuery]);

  return (
    <div className="space-y-6">
      <SeoHead
        title="BPSC Cloud Academic Resources | Teacher Panel"
        description="Access institutional routines, syllabi, question banks, and academic calendars hosted on Google Drive."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#100261]" />
            <span>BPSC Cloud Academic Repository</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official curriculum materials, question papers, class routines, and academic calendars.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#100261]/5 text-[#100261] border border-[#100261]/10 self-start sm:self-auto">
          {filteredDocs.length} Resources
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Resource Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none"
            >
              <option value="All">All Classes & Institutional</option>
              {teacherProfile?.assignedClasses?.map((cls) => (
                <option key={cls} value={cls}>
                  {cls.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search Document
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title or subject..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none"
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
        </div>
      </div>

      {/* Cloud Documents Cards */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#100261]/20 border-t-[#100261] animate-spin" />
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {doc.category}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {doc.fileType} {doc.fileSize && `• ${doc.fileSize}`}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{doc.title}</h3>

                {doc.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{doc.description}</p>
                )}

                <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 pt-1">
                  {doc.className && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                      {doc.className}
                    </span>
                  )}
                  {doc.subject && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                      {doc.subject}
                    </span>
                  )}
                  {doc.academicYear && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                      {doc.academicYear}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href={doc.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#100261] hover:bg-[#142863] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#F0C94A]" />
                  <span>Open in Google Drive</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <Cloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold">No Cloud resources found for this filter.</p>
        </div>
      )}
    </div>
  );
};
