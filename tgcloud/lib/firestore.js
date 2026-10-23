// tgcloud/lib/firestore.js
// Bridge to Firebase Firestore using the outbound HTTP fetch available in tgcloud.
// tgcloud modules can make outbound HTTP calls; we use Firebase REST API here
// since firebase-admin SDK isn't available in the V8 sandbox.
// https://firebase.google.com/docs/firestore/use-rest-api

import { fetch } from 'sdk';
import { CONFIG } from './config.js';

const PROJECT_ID = CONFIG.FIREBASE_PROJECT_ID;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Simple in-memory cache to avoid re-signing JWTs on every call within the same invocation
let _cachedToken = null;
let _tokenExpiry = 0;

/**
 * Get a Google service account access token using JWT + WebCrypto.
 */
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && now < _tokenExpiry - 60) return _cachedToken;

  const saJson = typeof process !== 'undefined' && process.env ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON : null;
  if (!saJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not configured');
  }

  const sa = JSON.parse(saJson);
  if (!sa.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON invalid: missing private_key');

  const header  = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64u(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const keyData  = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  const sig = b64u(sigBuf);
  const jwt = `${header}.${payload}.${sig}`;

  const res  = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  _cachedToken = data.access_token;
  _tokenExpiry = now + 3600;
  return _cachedToken;
}

/** Base64url encode (string or ArrayBuffer) */
function b64u(input) {
  const str = typeof input === 'string'
    ? input
    : String.fromCharCode(...new Uint8Array(input));
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** Convert Firestore REST value to JS primitive */
function fromFirestoreValue(v) {
  if (v.stringValue  !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue  !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue    !== undefined) return null;
  if (v.mapValue     !== undefined) {
    const obj = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(val);
    }
    return obj;
  }
  if (v.arrayValue !== undefined) {
    return (v.arrayValue.values || []).map(fromFirestoreValue);
  }
  return undefined;
}

/** Convert JS value to Firestore REST format */
function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string')  return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: String(value) };
}

/** GET a Firestore document */
async function getDocument(collection, docId) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/${collection}/${docId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET failed: ${res.status}`);
  const data = await res.json();
  if (!data.fields) return null;
  const obj = { id: docId };
  for (const [k, v] of Object.entries(data.fields)) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

/** GET all documents in a collection (up to 100) */
async function listDocuments(collectionPath) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/${collectionPath}?pageSize=100`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Firestore LIST failed: ${res.status}`);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map(doc => {
    const id = doc.name.split('/').pop();
    const obj = { id };
    for (const [k, v] of Object.entries(doc.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  });
}

/** PATCH a Firestore document */
async function patchDocument(collection, docId, fields) {
  const token = await getAccessToken();
  const firestoreFields = {};
  for (const [key, value] of Object.entries(fields)) {
    firestoreFields[key] = toFirestoreValue(value);
  }
  const updateMask = Object.keys(fields)
    .map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join('&');
  const res = await fetch(`${BASE_URL}/${collection}/${docId}?${updateMask}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore PATCH failed: ${res.status} ${err}`);
  }
  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch a café's Telegram notification settings from their Firestore user doc + departments.
 * Each restaurant owner stores their own chat IDs — this is a multi-tenant system.
 */
export async function getCafeTelegramSettings(cafeId) {
  const DEFAULT_ADMIN   = CONFIG.DEFAULT_ADMIN_CHAT_ID;
  const DEFAULT_KITCHEN = CONFIG.DEFAULT_KITCHEN_CHAT_ID;
  const DEFAULT_BAR     = CONFIG.DEFAULT_BAR_CHAT_ID;

  try {
    // 1. Get user profile
    const user = await getDocument('users', cafeId);

    // 2. Get departments for this café
    const departments = await listDocuments(`users/${cafeId}/departments`);

    // Find each role-specific department
    const adminDept   = departments.find(d => d.role === 'admin');
    const cashierDept = departments.find(d => d.role === 'cashier');
    const kitchenDept = departments.find(d => d.role === 'kitchen');
    const barDept     = departments.find(d => d.role === 'bar');

    const adminChatId   = Number(
      adminDept?.telegramChatId   ||
      cashierDept?.telegramChatId ||
      cashierDept?.adminChatId    ||
      user?.telegramSettings?.adminChatId ||
      user?.telegramChatId        ||
      DEFAULT_ADMIN
    );

    const kitchenChatId = Number(
      kitchenDept?.telegramChatId ||
      user?.telegramSettings?.kitchenChatId ||
      DEFAULT_KITCHEN
    );

    const barChatId = Number(
      barDept?.telegramChatId ||
      DEFAULT_BAR
    );

    return { adminChatId, kitchenChatId, barChatId, departments };
  } catch (err) {
    console.error('getCafeTelegramSettings error:', err?.message || err);
    // Fallback to global env defaults if Firestore lookup fails
    return {
      adminChatId:   DEFAULT_ADMIN,
      kitchenChatId: DEFAULT_KITCHEN,
      barChatId:     DEFAULT_BAR,
      departments:   [],
    };
  }
}

/** Get an order document (tries pendingOrders then orders) */
export async function getFirestoreOrder(orderId) {
  try {
    const doc = await getDocument('pendingOrders', orderId);
    if (doc) return doc;
  } catch (_) {}
  return await getDocument('orders', orderId);
}

/** Update an order document (tries pendingOrders then orders) */
export async function updateFirestoreOrder(orderId, fields) {
  try {
    return await patchDocument('pendingOrders', orderId, fields);
  } catch {
    return await patchDocument('orders', orderId, fields);
  }
}

/** Update a payment confirmation document */
export async function updateFirestorePayment(confirmationId, status) {
  return await patchDocument('paymentConfirmations', confirmationId, { status });
}
