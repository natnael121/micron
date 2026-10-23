// Cryptographic Telegram WebApp initData validation endpoint
// Follows official Telegram Mini App validation specification
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { initData } = req.body;
    if (!initData) {
      return res.status(400).json({ error: 'initData parameter is required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured on the server' });
    }

    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');
    if (!hash) {
      return res.status(400).json({ valid: false, error: 'No hash found in initData' });
    }

    // Remove hash from params to calculate check string
    searchParams.delete('hash');

    // Sort parameters alphabetically
    const dataCheckString = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    // HMAC-SHA-256 of dataCheckString using HMAC-SHA-256('WebAppData', botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const isValid = calculatedHash === hash;

    if (!isValid) {
      return res.status(401).json({ valid: false, error: 'Invalid authentication hash' });
    }

    const userRaw = searchParams.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const authDate = searchParams.get('auth_date');
    const startParam = searchParams.get('start_param');

    // Check auth freshness (24h)
    if (authDate) {
      const currentTime = Math.floor(Date.now() / 1000);
      const age = currentTime - Number(authDate);
      if (age > 86400) {
        return res.status(401).json({ valid: false, error: 'Authentication data expired (> 24 hours)' });
      }
    }

    return res.status(200).json({
      valid: true,
      user,
      authDate,
      startParam,
    });
  } catch (error) {
    console.error('Telegram validation error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
