// Test endpoint to send a message to a specific chat
// POST /api/test-message

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }

  const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

  try {
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId and message are required' });
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      res.status(200).json({ success: true, message: 'Message sent successfully!', result });
    } else {
      res.status(400).json({ success: false, error: 'Failed to send message', result });
    }
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
}