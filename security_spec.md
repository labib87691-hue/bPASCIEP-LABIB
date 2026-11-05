# Security Specification — BEPZA Public School and College (BPSC) Phase 1–4

## 1. Data Invariants & Role-Based Access Control (RBAC)

1. **Default-Deny Catch-All**: Every path not explicitly matched denies all `read` and `write` operations.
2. **5-Role Master Admin RBAC (`/adminUsers/{uid}`)**:
   - Roles: `super_admin`, `admin`, `result_manager`, `cloud_manager`, `content_editor`.
   - Every admin action requires `request.auth != null && request.auth.token.email_verified == true` and an active (`isActive == true`) `/adminUsers/{uid}` record (or verified bootstrap owner `tofayel.tllt@gmail.com`).
   - **Super Admin Exclusivity**: Only `super_admin` (or initial verified bootstrap on own UID) can create, update, or delete `/adminUsers/{uid}` records. Non-super admins (`admin`, `result_manager`, `cloud_manager`, `content_editor`) and teachers CANNOT escalate roles.
3. **Module-Scoped Admin Write Permissions**:
   - `siteContent`, `banners`, `administration`, `governingBody`, `facilities`: `super_admin`, `admin`, `content_editor`.
   - `cloudDocuments`: `super_admin`, `admin`, `cloud_manager`.
   - `academicYears`, `examinations`, `subjects`, `gradingRules`, `results`, `resultSubjects`, `resultPublication`, `students`: `super_admin`, `admin`, `result_manager` (plus scoped draft-only teacher rules on `results`, `resultSubjects`, `resultPublication`).
   - `teachers`, `staff`, `teacherAccessRequests`, `authorizedTeachers`, `settings`, `schoolSettings`: `super_admin`, `admin`.
   - `notices`, `holidays`: `super_admin`, `admin`, `cloud_manager`, `content_editor`.
   - `news`, `events`, `gallery`, `contactMessages` (read/update/delete): `super_admin`, `admin`, `content_editor`.
4. **Public Visibility Gates (`isPublished == true`)**:
   - Public visitors can ONLY read `siteContent`, `banners`, `administration`, `governingBody`, `teachers`, `staff`, `notices`, `gallery`, `news`, `events`, `facilities`, `transport`, `settings`, `cloudDocuments`, and `holidays` when `isPublished == true`.
   - Public visitors and students can ONLY read `results` when `isPublished == true && workflowStatus == 'published'`, and `resultSubjects` when `isPublished == true`.
5. **Teacher Isolation (`/authorizedTeachers/{uid}` & `/teacherAccessRequests/{id}`)**:
   - Teachers never receive records in `adminUsers` and cannot publish results (`isPublished: true`), edit website content, manage Cloud documents, or modify school settings.
6. **Student & Contact PII Isolation (`/students`, `/contactMessages`)**:
   - `/students` is restricted strictly to authorized admins (`super_admin`, `admin`, `result_manager`).
   - `/contactMessages` allows public validated `create` (`status == 'new'`), while `get`, `list`, `update`, and `delete` are restricted strictly to authorized admins.
7. **Immutable Append-Only Audit Trail (`/activityLogs/{logId}`)**:
   - Only active Administrators can `create` log entries (`actorUid == request.auth.uid`, `createdAt == request.time`).
   - `allow update, delete: if false;` — no actor (not even `super_admin`) can alter or erase historical audit logs.

## 2. Adversarial Payloads Covered (Dirty Dozen + Phase 4 RBAC Extensions)

1. Unpublished Cloud Document Direct `get` Leak -> `PERMISSION_DENIED`.
2. Unpublished Cloud Document `list` Scraping -> `PERMISSION_DENIED`.
3. Public/Teacher Write on `cloudDocuments` -> `PERMISSION_DENIED`.
4. Malicious Non-Google-Drive / `javascript:` URL in `cloudDocuments` -> `PERMISSION_DENIED`.
5. Unpublished Draft/Approved Result Leak on `results` -> `PERMISSION_DENIED`.
6. Unauthorized Teacher Self-Publishing (`isPublished: true`) -> `PERMISSION_DENIED`.
7. Private Student Guardian PII Scraping on `students` -> `PERMISSION_DENIED`.
8. Non-Super-Admin Privilege Escalation on `adminUsers` (`content_editor` attempting to set own role to `super_admin`) -> `PERMISSION_DENIED`.
9. Tampering / Deleting Immutable `activityLogs` (`update` or `delete` on `/activityLogs/{id}`) -> `PERMISSION_DENIED`.
10. Unpublished Holiday Schedule Leak (`get` on `/holidays/{id}` while `isPublished == false`) -> `PERMISSION_DENIED`.
11. Teacher Attempting to Modify School Settings (`/schoolSettings/operational_main`) -> `PERMISSION_DENIED`.
12. Unverified Email Spoof (`email_verified == false`) Attempting Admin Bootstrap -> `PERMISSION_DENIED`.
