/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { PublicDataProvider } from './context/PublicDataContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { TeacherAuthProvider } from './context/TeacherAuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute';
import { HomePage } from './pages/HomePage';

// Public Pages
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const AdministrationPage = lazy(() =>
  import('./pages/AdministrationPage').then((m) => ({ default: m.AdministrationPage }))
);
const GoverningBodyPage = lazy(() =>
  import('./pages/GoverningBodyPage').then((m) => ({ default: m.GoverningBodyPage }))
);
const TeachersPage = lazy(() =>
  import('./pages/TeachersPage').then((m) => ({ default: m.TeachersPage }))
);
const TeacherDetailPage = lazy(() =>
  import('./pages/TeacherDetailPage').then((m) => ({ default: m.TeacherDetailPage }))
);
const NoticesPage = lazy(() =>
  import('./pages/NoticesPage').then((m) => ({ default: m.NoticesPage }))
);
const NoticeDetailPage = lazy(() =>
  import('./pages/NoticeDetailPage').then((m) => ({ default: m.NoticeDetailPage }))
);
const GalleryPage = lazy(() =>
  import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage }))
);
const NewsEventsPage = lazy(() =>
  import('./pages/NewsEventsPage').then((m) => ({ default: m.NewsEventsPage }))
);
const FacilitiesPage = lazy(() =>
  import('./pages/FacilitiesPage').then((m) => ({ default: m.FacilitiesPage }))
);
const TransportPage = lazy(() =>
  import('./pages/TransportPage').then((m) => ({ default: m.TransportPage }))
);
const AdmissionPage = lazy(() =>
  import('./pages/AdmissionPage').then((m) => ({ default: m.AdmissionPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const ResultPortalPage = lazy(() =>
  import('./pages/ResultPortalPage').then((m) => ({
    default: m.ResultPortalPage,
  }))
);
const CloudCenterPage = lazy(() =>
  import('./pages/CloudCenterPage').then((m) => ({
    default: m.CloudCenterPage,
  }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// Master Admin Panel Pages (Phase 4)
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminWebsiteContentPage = lazy(() =>
  import('./pages/admin/AdminWebsiteContentPage').then((m) => ({
    default: m.AdminWebsiteContentPage,
  }))
);
const AdminCloudPage = lazy(() =>
  import('./pages/admin/AdminCloudPage').then((m) => ({ default: m.AdminCloudPage }))
);
const AdminResultsPage = lazy(() =>
  import('./pages/admin/AdminResultsPage').then((m) => ({ default: m.AdminResultsPage }))
);
const AdminTeachersPage = lazy(() =>
  import('./pages/admin/AdminTeachersPage').then((m) => ({ default: m.AdminTeachersPage }))
);
const AdminStudentsPage = lazy(() =>
  import('./pages/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage }))
);
const AdminNoticesPage = lazy(() =>
  import('./pages/admin/AdminNoticesPage').then((m) => ({ default: m.AdminNoticesPage }))
);
const AdminNewsEventsPage = lazy(() =>
  import('./pages/admin/AdminNewsEventsPage').then((m) => ({ default: m.AdminNewsEventsPage }))
);
const AdminGalleryPage = lazy(() =>
  import('./pages/admin/AdminGalleryPage').then((m) => ({ default: m.AdminGalleryPage }))
);
const AdminHolidaysPage = lazy(() =>
  import('./pages/admin/AdminHolidaysPage').then((m) => ({ default: m.AdminHolidaysPage }))
);
const AdminTeacherAccessPage = lazy(() =>
  import('./pages/admin/AdminTeacherAccessPage').then((m) => ({
    default: m.AdminTeacherAccessPage,
  }))
);
const AdminContactMessagesPage = lazy(() =>
  import('./pages/admin/AdminContactMessagesPage').then((m) => ({
    default: m.AdminContactMessagesPage,
  }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminActivityLogsPage = lazy(() =>
  import('./pages/admin/AdminActivityLogsPage').then((m) => ({
    default: m.AdminActivityLogsPage,
  }))
);

// Phase 5 Teacher Panel Pages
const TeacherLayout = lazy(() =>
  import('./components/teacher/TeacherLayout').then((m) => ({ default: m.TeacherLayout }))
);
const ProtectedTeacherRoute = lazy(() =>
  import('./components/teacher/ProtectedTeacherRoute').then((m) => ({
    default: m.ProtectedTeacherRoute,
  }))
);
const TeacherLoginPage = lazy(() =>
  import('./pages/teacher/TeacherLoginPage').then((m) => ({ default: m.TeacherLoginPage }))
);
const TeacherDashboardPage = lazy(() =>
  import('./pages/teacher/TeacherDashboardPage').then((m) => ({
    default: m.TeacherDashboardPage,
  }))
);
const TeacherProfilePage = lazy(() =>
  import('./pages/teacher/TeacherProfilePage').then((m) => ({ default: m.TeacherProfilePage }))
);
const TeacherClassesPage = lazy(() =>
  import('./pages/teacher/TeacherClassesPage').then((m) => ({ default: m.TeacherClassesPage }))
);
const TeacherStudentsPage = lazy(() =>
  import('./pages/teacher/TeacherStudentsPage').then((m) => ({
    default: m.TeacherStudentsPage,
  }))
);
const TeacherNoticesPage = lazy(() =>
  import('./pages/teacher/TeacherNoticesPage').then((m) => ({ default: m.TeacherNoticesPage }))
);
const TeacherCloudPage = lazy(() =>
  import('./pages/teacher/TeacherCloudPage').then((m) => ({ default: m.TeacherCloudPage }))
);
const TeacherResultsPage = lazy(() =>
  import('./pages/teacher/TeacherResultsPage').then((m) => ({ default: m.TeacherResultsPage }))
);
const TeacherAttendancePage = lazy(() =>
  import('./pages/teacher/TeacherAttendancePage').then((m) => ({
    default: m.TeacherAttendancePage,
  }))
);
const TeacherSettingsPage = lazy(() =>
  import('./pages/teacher/TeacherSettingsPage').then((m) => ({ default: m.TeacherSettingsPage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[55vh] flex items-center justify-center bg-[#F6F8FC]">
    <div className="w-7 h-7 rounded-full border-2 border-[#102B50]/20 border-t-[#1F5FAF] animate-spin" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <PublicDataProvider>
          <AdminAuthProvider>
            <TeacherAuthProvider>
              <BrowserRouter>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    {/* Master Admin Panel Routes */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route element={<ProtectedAdminRoute />}>
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="website-content" element={<AdminWebsiteContentPage />} />
                        <Route path="cloud" element={<AdminCloudPage />} />
                        <Route path="results" element={<AdminResultsPage />} />
                        <Route path="teachers" element={<AdminTeachersPage />} />
                        <Route path="students" element={<AdminStudentsPage />} />
                        <Route path="notices" element={<AdminNoticesPage />} />
                        <Route path="news-events" element={<AdminNewsEventsPage />} />
                        <Route path="gallery" element={<AdminGalleryPage />} />
                        <Route path="holidays" element={<AdminHolidaysPage />} />
                        <Route path="teacher-access" element={<AdminTeacherAccessPage />} />
                        <Route path="contact-messages" element={<AdminContactMessagesPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="activity-logs" element={<AdminActivityLogsPage />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                      </Route>
                    </Route>

                    {/* Phase 5 Teacher Panel Routes */}
                    <Route path="/teacher/login" element={<TeacherLoginPage />} />
                    <Route element={<ProtectedTeacherRoute />}>
                      <Route path="/teacher" element={<TeacherLayout />}>
                        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                        <Route path="dashboard" element={<TeacherDashboardPage />} />
                        <Route path="profile" element={<TeacherProfilePage />} />
                        <Route path="classes" element={<TeacherClassesPage />} />
                        <Route path="students" element={<TeacherStudentsPage />} />
                        <Route path="notices" element={<TeacherNoticesPage />} />
                        <Route path="cloud" element={<TeacherCloudPage />} />
                        <Route path="results" element={<TeacherResultsPage />} />
                        <Route path="attendance" element={<TeacherAttendancePage />} />
                        <Route path="settings" element={<TeacherSettingsPage />} />
                        <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
                      </Route>
                    </Route>

                  {/* Main Public Website Routes */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/administration" element={<AdministrationPage />} />
                    <Route path="/governing-body" element={<GoverningBodyPage />} />
                    <Route path="/teachers" element={<TeachersPage />} />
                    <Route path="/teachers/:id" element={<TeacherDetailPage />} />

                    {/* Legacy Academic bookmarks cleanly centralized into BPSC Cloud (/cloud) */}
                    <Route path="/academic" element={<Navigate to="/cloud" replace />} />
                    <Route path="/academic/classes" element={<Navigate to="/cloud" replace />} />
                    <Route
                      path="/academic/class-routine"
                      element={<Navigate to="/cloud?category=Class+Routine" replace />}
                    />
                    <Route
                      path="/academic/exam-routine"
                      element={<Navigate to="/cloud?category=Exam+Routine" replace />}
                    />
                    <Route
                      path="/academic/syllabus"
                      element={<Navigate to="/cloud?category=Syllabus" replace />}
                    />
                    <Route
                      path="/academic/calendar"
                      element={<Navigate to="/cloud?category=Holiday+List" replace />}
                    />

                    <Route path="/notices" element={<NoticesPage />} />
                    <Route path="/notices/:id" element={<NoticeDetailPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/news" element={<NewsEventsPage />} />
                    <Route path="/facilities" element={<FacilitiesPage />} />
                    <Route path="/transport" element={<TransportPage />} />
                    <Route path="/admission" element={<AdmissionPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/result" element={<ResultPortalPage />} />
                    <Route path="/cloud" element={<CloudCenterPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TeacherAuthProvider>
        </AdminAuthProvider>
      </PublicDataProvider>
    </LanguageProvider>
  </ErrorBoundary>
);
}
