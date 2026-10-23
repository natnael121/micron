// Utility script to set up the Telegram webhook
// Can be called via POST /api/setup-webhook

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || process.env.VITE_TELEGRAM_WEBHOOK_URL;
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }

  if (!WEBHOOK_URL) {
    return res.status(500).json({ error: 'TELEGRAM_WEBHOOK_URL is not configured' });
  }

  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    const payload = {
      url: WEBHOOK_URL,
      allowed_updates: ['callback_query', 'message'],
      drop_pending_updates: true,
    };

    if (WEBHOOK_SECRET) {
      payload.secret_token = WEBHOOK_SECRET;
    }

    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (result.ok) {
      res.status(200).json({ 
        success: true, 
        message: 'Telegram Webhook set up successfully!',
        webhook_url: WEBHOOK_URL,
        result: result
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Failed to set up webhook',
        result: result
      });
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
}