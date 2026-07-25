// Gantilah struktur ekspor di file bot.js kamu menjadi seperti ini:

export default async function handler(req, res) {
  // 1. Terima request POST dari Telegram
  if (req.method === 'POST') {
    try {
      const update = req.body;

      // Jalankan logika bot kamu di sini
      // ... (kode bot kamu) ...

      // Kirim status 200 ke Telegram agar Telegram tahu pesan berhasil diterima
      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // 2. Jika dibuka lewat browser (GET request)
  return res.status(200).send('Bot PT Gym Server is Running!');
}
