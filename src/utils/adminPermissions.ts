import { AdminPermissionKey, AdminRole } from '../types/admin';

export interface RoleMetadata {
  role: AdminRole;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
}

export const ADMIN_ROLE_METADATA: Record<AdminRole, RoleMetadata> = {
  super_admin: {
    role: 'super_admin',
    labelEn: 'Super Admin',
    labelBn: 'সুপার অ্যাডমিন',
    descriptionEn:
      'Full institutional authority across all modules, settings, and administrator role assignments.',
  },
  admin: {
    role: 'admin',
    labelEn: 'Admin',
    labelBn: 'অ্যাডমিন',
    descriptionEn:
      'Full operational control across website content, cloud, results, teachers, students, and inbox.',
  },
  result_manager: {
    role: 'result_manager',
    labelEn: 'Result Manager',
    labelBn: 'ফলাফল ব্যবস্থাপক',
    descriptionEn:
      'Manages examinations, subjects, grading rules, student records, marks verification, approval, and result publication.',
  },
  cloud_manager: {
    role: 'cloud_manager',
    labelEn: 'Cloud Manager',
    labelBn: 'ক্লাউড ব্যবস্থাপক',
    descriptionEn:
      'Manages BPSC Cloud documents, routines, syllabi, forms, notices, and official holiday schedules.',
  },
  content_editor: {
    role: 'content_editor',
    labelEn: 'Content Editor',
    labelBn: 'কনটেন্ট এডিটর',
    descriptionEn:
      'Manages website content, banners, notices, news & events, photo gallery, holidays, and contact inquiries.',
  },
};

const ROLE_PERMISSION_MAP: Record<AdminRole, Set<AdminPermissionKey>> = {
  super_admin: new Set<AdminPermissionKey>([
    'view_dashboard',
    'manage_website_content',
    'manage_cloud',
    'manage_results',
    'approve_publish_results',
    'manage_teachers',
    'manage_students',
    'manage_notices',
    'manage_news_events',
    'manage_gallery',
    'manage_holidays',
    'manage_teacher_access',
    'manage_contact_messages',
    'manage_settings',
    'manage_admin_roles',
    'view_activity_logs',
    'generate_qr',
  ]),
  admin: new Set<AdminPermissionKey>([
    'view_dashboard',
    'manage_website_content',
    'manage_cloud',
    'manage_results',
    'approve_publish_results',
    'manage_teachers',
    'manage_students',
    'manage_notices',
    'manage_news_events',
    'manage_gallery',
    'manage_holidays',
    'manage_teacher_access',
    'manage_contact_messages',
    'manage_settings',
    'view_activity_logs',
    'generate_qr',
  ]),
  result_manager: new Set<AdminPermissionKey>([
    'view_dashboard',
    'manage_results',
    'approve_publish_results',
    'manage_students',
    'view_activity_logs',
    'generate_qr',
  ]),
  cloud_manager: new Set<AdminPermissionKey>([
    'view_dashboard',
    'manage_cloud',
    'manage_notices',
    'manage_holidays',
    'view_activity_logs',
    'generate_qr',
  ]),
  content_editor: new Set<AdminPermissionKey>([
    'view_dashboard',
    'manage_website_content',
    'manage_notices',
    'manage_news_events',
    'manage_gallery',
    'manage_holidays',
    'manage_contact_messages',
    'view_activity_logs',
    'generate_qr',
  ]),
};

export function hasAdminPermission(
  role: AdminRole | null | undefined,
  permission: AdminPermissionKey
): boolean {
  if (!role) return false;
  return ROLE_PERMISSION_MAP[role]?.has(permission) ?? false;
}

export function getRequiredPermissionForPath(pathname: string): AdminPermissionKey {
  if (pathname.startsWith('/admin/website-content')) return 'manage_website_content';
  if (pathname.startsWith('/admin/cloud')) return 'manage_cloud';
  if (pathname.startsWith('/admin/results')) return 'manage_results';
  if (pathname.startsWith('/admin/teachers')) return 'manage_teachers';
  if (pathname.startsWith('/admin/students')) return 'manage_students';
  if (pathname.startsWith('/admin/notices')) return 'manage_notices';
  if (pathname.startsWith('/admin/news-events')) return 'manage_news_events';
  if (pathname.startsWith('/admin/gallery')) return 'manage_gallery';
  if (pathname.startsWith('/admin/holidays')) return 'manage_holidays';
  if (pathname.startsWith('/admin/teacher-access')) return 'manage_teacher_access';
  if (pathname.startsWith('/admin/contact-messages')) return 'manage_contact_messages';
  if (pathname.startsWith('/admin/settings')) return 'manage_settings';
  if (pathname.startsWith('/admin/activity-logs')) return 'view_activity_logs';
  return 'view_dashboard';
}

export function canAccessAdminPath(
  role: AdminRole | null | undefined,
  pathname: string
): boolean {
  if (!role) return false;
  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return hasAdminPermission(role, 'view_dashboard');
  }
  const required = getRequiredPermissionForPath(pathname);
  return hasAdminPermission(role, required);
}
