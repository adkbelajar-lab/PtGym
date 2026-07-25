const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `Kamu adalah Personal Trainer (PT) Gym profesional, ramah, dan sangat perhatian. 
Tugasmu:
1. Membantu menyusun jadwal latihan & konsultasi nutrisi/fitness.
2. Mencatat laporan berat badan (BB) & progress latihan klien jika mereka melapor.
3. Menjawab pertanyaan seputar gym dengan jelas dan aplikatif.
Gunakan bahasa santai tapi tetap profesional (seperti bro/sis atau sebutan akrab lainnya).`;

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const update = req.body;
      const message = update ? update.message : null;

      if (message && message.text) {
        const userId = message.from.id;
        const userText = message.text;

        // 1. Ambil data klien dari Supabase
        let { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('telegram_id', userId)
          .single();

        if (!client) {
          const { data: newClient } = await supabase
            .from('clients')
            .insert([{ telegram_id: userId, name: message.from.first_name, chat_history: [] }])
            .select()
            .single();
          client = newClient;
        }

        // 2. Siapkan histori chat untuk AI
        const history = client.chat_history || [];
        const formattedHistory = history.map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        }));

        // 3. Panggil Gemini AI
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          systemInstruction: SYSTEM_INSTRUCTION 
        });

        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(userText);
        const replyText = result.response.text();

        // 4. Update Histori Chat ke Supabase (Simpan 10 percakapan terakhir)
        const updatedHistory = [
          ...history,
          { role: 'user', text: userText },
          { role: 'model', text: replyText }
        ].slice(-10);

        await supabase
          .from('clients')
          .update({ chat_history: updatedHistory })
          .eq('telegram_id', userId);

        // 5. Kirim balasan ke Telegram
        await bot.telegram.sendMessage(userId, replyText);
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};
