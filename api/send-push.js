// api/send-push.js — Vercel serverless function
// Sends FCM push notifications to a list of device tokens using Firebase Admin SDK.
//
// POST body: {
//   tokens: string[],           // FCM device tokens
//   title: string,              // Notification title
//   body: string,               // Notification body
//   data?: Record<string,string> // Optional extra data payload
// }

const admin = require('firebase-admin');

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialise Firebase Admin inside handler to safely catch and return initialization errors
  try {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY || '';

      // Strip outer quotes if Vercel or local env config wrapped the string in quotes
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(`Missing credentials: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`);
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } catch (initError) {
    console.error('Firebase Admin SDK initialization failed:', initError);
    return res.status(500).json({
      error: 'Firebase Admin SDK initialization failed',
      detail: initError.message,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokens, title, body, data } = req.body || {};

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: 'tokens array is required' });
  }
  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  // Stringify all data values (FCM requires string values)
  const stringData = {};
  if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = String(v);
    }
  }

  try {
    // Send multicast to all tokens (FCM batches up to 500 tokens per call)
    const chunks = chunkArray(tokens, 500);
    const results = [];

    for (const chunk of chunks) {
      const message = {
        notification: { title, body },
        data: stringData,
        tokens: chunk,
        webpush: {
          notification: {
            title,
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            requireInteraction: true,
          },
          fcmOptions: {
            link: stringData.url || '/',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      results.push({
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Log failures for debugging (do not block response)
      response.responses.forEach((r, idx) => {
        if (!r.success) {
          console.error(`FCM send failed for token ${chunk[idx].slice(0, 20)}...:`, r.error?.message);
        }
      });
    }

    const totalSuccess = results.reduce((s, r) => s + r.successCount, 0);
    const totalFailure = results.reduce((s, r) => s + r.failureCount, 0);

    return res.status(200).json({
      ok: true,
      successCount: totalSuccess,
      failureCount: totalFailure,
    });
  } catch (error) {
    console.error('FCM send error:', error);
    return res.status(500).json({ error: 'Failed to send push notifications', detail: error.message });
  }
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
