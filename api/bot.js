export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const message = body.message;

      if (message && message.text) {
        const chatId = message.chat.id;
        const userText = message.text;

        const telegramToken = process.env.TELEGRAM_TOKEN;
        const groqApiKey = process.env.GROQ_API_KEY;

        let replyText = "";

        if (!groqApiKey) {
          replyText = "Error: GROQ_API_KEY belum dipasang di Vercel!";
        } else {
          try {
            // Memanggil API Groq (Llama 3.3 70B)
            const groqRes = await fetch(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${groqApiKey}`
                },
                body: JSON.stringify({
                  model: 'llama-3.3-70b-versatile',
                  messages: [
                    {
                      role: 'system',
                      content: 'Kamu adalah Personal Trainer (PT) Gym yang ramah, profesional, dan membantu. Jawab pertanyaan user secara ringkas, jelas, dan informatif.'
                    },
                    {
                      role: 'user',
                      content: userText
                    }
                  ]
                })
              }
            );

            const data = await groqRes.json();

            if (data.choices && data.choices[0]?.message?.content) {
              replyText = data.choices[0].message.content;
            } else if (data.error) {
              console.error("Groq API Error Detail:", data.error);
              replyText = `Error Groq: ${data.error.message}`;
            } else {
              replyText = "Maaf, AI tidak memberikan respon.";
            }
          } catch (err) {
            console.error("Fetch Groq Error:", err);
            replyText = "Gagal terhubung ke server AI Groq.";
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

  return res.status(200).send('Bot Active with Groq AI');
}
