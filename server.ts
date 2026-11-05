import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebasePublicConfig {
  projectId?: string;
  apiKey?: string;
  firestoreDatabaseId?: string;
}

function readFirebasePublicConfig(): FirebasePublicConfig {
  try {
    const configPath = path.join(__dirname, 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as FirebasePublicConfig;
  } catch {
    return {};
  }
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '256kb' }));

  // Authorized server-side check for one-time Super Admin setup status (zero secrets exposed)
  app.get('/api/admin/setup-info', (_req: Request, res: Response) => {
    const fbConfig = readFirebasePublicConfig();
    res.json({
      ok: true,
      projectId: fbConfig.projectId || null,
      firestoreDatabaseId: fbConfig.firestoreDatabaseId || null,
      serverBootstrapReady: true,
      customBootstrapEmailConfigured: Boolean(
        process.env.INITIAL_SUPER_ADMIN_EMAIL && process.env.INITIAL_SUPER_ADMIN_EMAIL.trim()
      ),
      authGuidance:
        'Use Firebase Authentication (Email/Password or Google Sign-In). Ensure Email/Password Sign-In is enabled in Firebase Console -> Authentication -> Sign-in method.',
    });
  });

  // Server-side Firebase ID token verification for one-time Super Admin bootstrap eligibility
  app.post('/api/admin/verify-bootstrap', async (req: Request, res: Response) => {
    try {
      const authHeader = String(req.headers.authorization || '');
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ ok: false, error: 'MISSING_BEARER_TOKEN' });
        return;
      }

      const idToken = authHeader.slice('Bearer '.length).trim();
      if (!idToken || idToken.length < 40) {
        res.status(401).json({ ok: false, error: 'INVALID_ID_TOKEN' });
        return;
      }

      const fbConfig = readFirebasePublicConfig();
      if (!fbConfig.apiKey) {
        res.status(503).json({ ok: false, error: 'FIREBASE_NOT_CONFIGURED' });
        return;
      }

      // Verify ID token directly with Google Identity Toolkit server endpoint
      const verifyResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
          fbConfig.apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!verifyResp.ok) {
        res.status(401).json({ ok: false, error: 'TOKEN_VERIFICATION_FAILED' });
        return;
      }

      const payload = (await verifyResp.json()) as {
        users?: Array<{
          localId?: string;
          email?: string;
          emailVerified?: boolean;
          displayName?: string;
        }>;
      };

      const verifiedUser = payload.users?.[0];
      if (!verifiedUser?.localId || !verifiedUser?.email) {
        res.status(401).json({ ok: false, error: 'UNVERIFIED_ACCOUNT' });
        return;
      }

      if (verifiedUser.emailVerified !== true) {
        res.status(403).json({
          ok: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Administrator email address must be verified before Super Admin setup.',
        });
        return;
      }

      const allowedEmails = new Set<string>([
        'tofayel.tllt@gmail.com',
        'labib87691@gmail.com',
      ]);
      if (process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim()) {
        allowedEmails.add(process.env.INITIAL_SUPER_ADMIN_EMAIL.trim().toLowerCase());
      }

      const normalizedEmail = verifiedUser.email.trim().toLowerCase();
      const eligibleForBootstrap = allowedEmails.has(normalizedEmail);

      res.json({
        ok: true,
        uid: verifiedUser.localId,
        email: normalizedEmail,
        displayName: verifiedUser.displayName || normalizedEmail.split('@')[0],
        emailVerified: true,
        eligibleForBootstrap,
      });
    } catch (err) {
      console.error('Admin token verification error:', err);
      res.status(500).json({ ok: false, error: 'INTERNAL_VERIFICATION_ERROR' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Development SPA Fallback: handle direct URL access (e.g. /teachers, /cloud, /result, /admin)
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`BPSC Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
