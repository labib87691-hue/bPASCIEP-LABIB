import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase';
import { ActivityActionType, ActivityLogRecord, AdminRole } from '../types/admin';

const FORBIDDEN_CREDENTIAL_KEYS = /password|secret|token|apikey|credential|privatekey/i;

function sanitizeLogMetadata(
  raw?: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> {
  if (!raw) return {};
  const out: Record<string, string | number | boolean | null> = {};
  const entries = Object.entries(raw).slice(0, 10);
  for (const [k, v] of entries) {
    if (FORBIDDEN_CREDENTIAL_KEYS.test(k)) continue;
    const cleanKey = k.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 40);
    if (!cleanKey) continue;
    if (typeof v === 'string') {
      out[cleanKey] = v.slice(0, 200);
    } else if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
      out[cleanKey] = v;
    }
  }
  return out;
}

function timestampToIso(val: unknown): string {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate().toISOString();
  }
  if (typeof val === 'string' && val.trim()) return val;
  return new Date().toISOString();
}

export interface RecordActivityParams {
  actionType: ActivityActionType;
  targetCollection: string;
  targetId: string;
  summary: string;
  actorRole: AdminRole;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Writes an immutable administrative audit log entry to `activityLogs`.
 * Never stores passwords, tokens, or sensitive credentials.
 */
export async function recordActivityLog(params: RecordActivityParams): Promise<void> {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) return;

  const currentUser = auth.currentUser;
  const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `activityLogs/${logId}`;

  try {
    await setDoc(doc(db, 'activityLogs', logId), {
      actorUid: currentUser.uid,
      actorEmail: (currentUser.email || 'unknown@bpsciepz.edu.bd').slice(0, 160),
      actorRole: params.actorRole,
      actionType: params.actionType,
      targetCollection: params.targetCollection.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60),
      targetId: params.targetId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
      summary: params.summary.trim().slice(0, 400),
      metadata: sanitizeLogMetadata(params.metadata),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Non-blocking audit log fallback if user lacks write permission during logout/bootstrap edge case
    console.warn('Activity log write warning:', path, error);
  }
}

export async function fetchActivityLogs(
  viewerRole: AdminRole,
  maxItems = 100
): Promise<ActivityLogRecord[]> {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) return [];

  const path = 'activityLogs';
  try {
    const canReadAllLogs = viewerRole === 'super_admin' || viewerRole === 'admin';
    const q = canReadAllLogs
      ? query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'), limit(maxItems))
      : query(
          collection(db, 'activityLogs'),
          where('actorUid', '==', auth.currentUser.uid),
          limit(maxItems)
        );

    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        actorUid: String(raw.actorUid || ''),
        actorEmail: String(raw.actorEmail || ''),
        actorRole: (raw.actorRole as AdminRole) || 'admin',
        actionType: (raw.actionType as ActivityActionType) || 'settings_changed',
        targetCollection: String(raw.targetCollection || ''),
        targetId: String(raw.targetId || ''),
        summary: String(raw.summary || ''),
        metadata: (raw.metadata as Record<string, string | number | boolean | null>) || {},
        createdAtIso: timestampToIso(raw.createdAt),
      } satisfies ActivityLogRecord;
    });

    return items.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  }
}
