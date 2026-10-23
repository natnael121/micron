// Get Telegram Webhook information
// GET /api/webhook-info

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }

  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`);
    const result = await response.json();
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}