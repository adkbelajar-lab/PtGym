export default async function handler(req, res) {
  // Hanya proses jika request datang berupa POST dari Telegram
  if (req.method === 'POST') {
    try {
      // Pastikan body diterima
      const body = req.body || {};
      const message = body.message;

      // Jika ada pesan teks masuk dari user
      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;

        // Ambil token dari Environment Variable
        const token = process.env.TELEGRAM_TOKEN;

        // Kirim balasan langsung ke Telegram API
        if (token) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `Halo! Saya menerima pesanmu: "${text}"`
            })
          });
        }
      }

      // Selalu kembalikan respon 200 OK ke Telegram
      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error handling update:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Jika dibuka dari browser
  return res.status(200).send('Server Bot PT Gym Aktif!');
}
