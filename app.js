import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dashboardRouter from "./routes/dashboard.routes.js";
import { pool } from "./db.js"; // Veritabanı bağlantımız burada 'pool' adıyla geliyor

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

// Mevcut dashboard rotaları
app.use("/api/dashboard", dashboardRouter);

// --- YENİ EKLENEN GRAFİK ENDPOINT'İ (Buraya eklenmeli) ---
app.get('/api/trends/:districtId', async (req, res) => {
  const { districtId } = req.params;

  try {
    // 2025 Yaz Sezonu (Haziran-Kasım) verilerini çeken SQL
    const query = `
      SELECT 
        DATE_FORMAT(d.donem_tarihi, '%b %y') as name,
        iy.doluluk_orani as occupancy,
        iy.ort_verimlilik as productivity,
        (iy.toplam_is_birimi / iy.personel_sayi) as guestPerStaff,
        (t.piyasa_endeksi * 15000) as revenue
      FROM is_yuku iy
      JOIN donemler d ON iy.donem_id = d.donem_id
      LEFT JOIN tahmin t ON iy.donem_id = t.donem_id
      WHERE iy.ilce_id = ? 
      AND d.donem_tarihi BETWEEN '2025-06-01' AND '2025-11-30'
      ORDER BY d.donem_tarihi ASC
    `;

    // DÜZELTME: 'veritabaniBaglantisi' yerine yukarıda import ettiğin 'pool' değişkenini kullanıyoruz.
    const [results] = await pool.query(query, [districtId]);
    
    res.json(results);
  } catch (error) {
    console.error("Trend Query Error:", error);
    res.status(500).json({ error: 'Veritabanı hatası' });
  }
});
// ---------------------------------------------------------

// Hata yakalayıcı (En sonda durmalı)
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT || 5001);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});