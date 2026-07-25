export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const message = body.message;

      if (message && message.text) {
        const chatId = message.chat.id;
        const userText = message.text;

        const telegramToken = process.env.TELEGRAM_TOKEN;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        let replyText = "";

        if (!geminiApiKey) {
          replyText = "Error: GEMINI_API_KEY belum dipasang di Vercel!";
        } else {
          try {
            // Panggil API Gemini secara langsung tanpa SDK/Library
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: `Kamu adalah Personal Trainer (PT) Gym yang ramah, profesional, dan membantu. Jawab pertanyaan user berikut secara ringkas:\n\nUser: ${userText}`
                        }
                      ]
                    }
                  ]
                })
              }
            );

            const data = await geminiRes.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
              replyText = data.candidates[0].content.parts[0].text;
            } else if (data.error) {
              console.error("Gemini API Error Detail:", data.error);
              replyText = `Error Gemini: ${data.error.message || 'API Key tidak valid / kuota habis'}`;
            } else {
              replyText = "Maaf, AI tidak memberikan respon.";
            }
          } catch (err) {
            console.error("Fetch Gemini Error:", err);
            replyText = "Gagal terhubung ke server AI Gemini.";
          }
        }

        // Kirim balasan ke Telegram
        if (telegramToken && replyText) {
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText
            })
          });
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Handler Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(200).send('Bot Active');
}
