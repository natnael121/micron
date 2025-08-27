// Utility script to set up the Telegram webhook
// This can be called manually or through an API endpoint

const BOT_TOKEN = '1941939105:AAHJ9XhL9uRyzQ9uhi3F4rKAQIbQ9D7YRs8';
const WEBHOOK_URL = 'https://telegram-vercel-bot-three.vercel.app/api/telegram-webhook';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set webhook
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['callback_query', 'message'],
        drop_pending_updates: true
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      res.status(200).json({ 
        success: true, 
        message: 'Webhook set up successfully!',
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