/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  Phone,
  Search,
  User,
  Users,
  X,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { fetchTeacherStudents } from '../../services/teacherService';
import { StudentRecord, SupportedClassCode } from '../../types/result';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherStudentsPage: React.FC = () => {
  const { teacherProfile } = useTeacherAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClass = searchParams.get('class') || (teacherProfile?.assignedClasses?.[0] || 'all');

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      if (!teacherProfile || !teacherProfile.assignedClasses.length) {
        setLoading(false);
        return;
      }
      try {
        const list = await fetchTeacherStudents(teacherProfile.assignedClasses);
        setStudents(list);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [teacherProfile]);

  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    if (newClass !== 'all') {
      setSearchParams({ class: newClass });
    } else {
      setSearchParams({});
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'all' && s.classCode !== selectedClass) return false;
      if (selectedSection !== 'all' && s.section !== selectedSection) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const rollMatch = s.rollNumber.includes(q);
        const nameEnMatch = s.fullNameEn.toLowerCase().includes(q);
        const nameBnMatch = s.fullNameBn ? s.fullNameBn.toLowerCase().includes(q) : false;
        return rollMatch || nameEnMatch || nameBnMatch;
      }
      return true;
    });
  }, [students, selectedClass, selectedSection, searchQuery]);

  return (
    <div className="space-y-6">
      <SeoHead
        title="My Students Directory | BPSC Teacher Panel"
        description="Search and view enrolled student profiles in assigned classes at BEPZA Public School and College."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#100261]" />
            <span>Assigned Students Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student rolls and guardian information strictly restricted to your assigned classes.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#100261]/5 text-[#100261] border border-[#100261]/10 self-start sm:self-auto">
          {filteredStudents.length} Students Showing
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none"
            >
              <option value="all">All Assigned Classes ({teacherProfile?.assignedClasses?.length || 0})</option>
              {teacherProfile?.assignedClasses?.map((cls) => (
                <option key={cls} value={cls}>
                  {cls.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter by Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261] focus:outline-none"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Roll or Name..."
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

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#100261]/20 border-t-[#100261] animate-spin" />
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#100261]">{s.rollNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{s.fullNameEn}</p>
                      {s.fullNameBn && (
                        <p className="text-[11px] text-slate-500">{s.fullNameBn}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-slate-700">
                      {s.classCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {s.section || 'General'}
                    </td>
                    <td className="py-3 px-4">
                      {s.guardianPhone ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.guardianPhone}</span>
                          {s.guardianName && (
                            <span className="text-[10px] text-slate-400">({s.guardianName})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not listed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">No students found matching current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
