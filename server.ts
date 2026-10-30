import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser for JSON with base64 image support (up to 25mb)
  app.use(express.json({ limit: '25mb' }));

  // Shared Gemini client configured according to guidelines
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // OCR Receipt extraction endpoint
  app.post('/api/ocr-receipt', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'Foto nota tidak boleh kosong' });
      }

      // Clean base64 prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `Periksa foto nota / struk belanja ini secara teliti.
Ekstrak semua informasi berikut dan kembalikan HANYA teks JSON valid tanpa format markdown (jangan gunakan backtick \`\`\`json):
{
  "storeName": "Nama toko / merchant atau vendor pada struk (misal: Toko Sembako Jaya, Alfamart, Indomaret, SPBU)",
  "date": "YYYY-MM-DD tanggal transaksi yang tertera (jika tahun 2 digit, sesuaikan ke 2026. Jika tidak ada, gunakan tanggal hari ini)",
  "items": [
    {
      "name": "nama barang atau jasa",
      "quantity": 1,
      "unitPrice": 15000,
      "subtotal": 15000
    }
  ],
  "totalAmount": 15000,
  "tax": 0,
  "discount": 0,
  "suggestedCategory": "Pilih salah satu yang paling cocok: Bahan Baku & Stok, Operasional & Perlengkapan, Sewa Tempat / Kios, Listrik, Air & Internet, Biaya Admin & Pajak, Biaya Lain-lain",
  "rawText": "Teks asli yang berhasil dibaca dari struk"
}

Peraturan:
1. Angka uang (totalAmount, unitPrice, subtotal, tax, discount) harus bertipe NUMBER integer murni tanpa koma/titik atau huruf Rp.
2. Jika ada diskon atau pajak, cantumkan nilainya.
3. Pastikan items berisi semua baris barang yang terbeli jika terlihat.
4. Jangan menambahkan teks pembuka atau penutup selain JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const responseText = response.text || '';
      // Find JSON block
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, data: parsed });
      } else {
        return res.status(422).json({
          success: false,
          error: 'Format JSON tidak ditemukan pada respon AI',
          rawText: responseText,
        });
      }
    } catch (err: any) {
      console.error('Error in /api/ocr-receipt:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Gagal memproses gambar struk dengan Gemini OCR',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Pembukuan UMKM', timestamp: new Date().toISOString() });
  });

  // Setup Vite dev middleware or serve built static dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Pembukuan UMKM berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
