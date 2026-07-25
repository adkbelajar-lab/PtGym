import { GoogleGenerativeAI } from "@google/generative-ai";

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

        // Panggil Google Gemini AI
        if (geminiApiKey) {
          try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            // Menggunakan model Gemini 1.5 Flash
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Kamu adalah Personal Trainer (PT) Gym yang ramah, profesional, dan membantu. Jawab pertanyaan user berikut secara ringkas dan mudah dipahami:\n\nUser: ${userText}`;
            
            const result = await model.generateContent(prompt);
            replyText = result.response.text();
          } catch (geminiError) {
            console.error("Gemini Error:", geminiError);
            replyText = "Maaf, AI sedang mengalami kendala. Coba tanya lagi nanti ya!";
          }
        } else {
          replyText = "API Key Gemini belum terpasang di Vercel!";
        }

        // Kirim balasan hasil AI ke Telegram
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

  return res.status(200).send('Server Bot PT Gym AI Ready!');
}
