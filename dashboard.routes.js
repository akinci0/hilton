import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// --- 1. ŞUBE LİSTESİ VE HARİTA VERİSİ ---
// --- 1. ŞUBE LİSTESİ VE HARİTA VERİSİ ---
// src/routes/dashboard.routes.js İÇİNDEKİ İLGİLİ KISIM:

router.get("/districts", async (req, res) => {
  try {
    const query = `
      SELECT 
        i.ilce_id as districtId,
        i.ilce_adi as name,
        COALESCE(AVG(iy.doluluk_orani), 0) as occupancy,
        
        -- ID YERİNE İSME GÖRE PUANLAMA (GARANTİ YÖNTEM)
        CASE 
            WHEN i.ilce_adi LIKE '%Çeşme%' OR i.ilce_adi LIKE '%Cesme%' THEN 4.9
            WHEN i.ilce_adi LIKE '%Konak%' THEN 4.7
            WHEN i.ilce_adi LIKE '%Karşıyaka%' OR i.ilce_adi LIKE '%Karsiyaka%' THEN 4.6
            WHEN i.ilce_adi LIKE '%Bayraklı%' OR i.ilce_adi LIKE '%Bayrakli%' THEN 4.4
            WHEN i.ilce_adi LIKE '%Gaziemir%' THEN 4.2
            ELSE 4.0
        END as score

      FROM ilceler i
      LEFT JOIN is_yuku iy ON i.ilce_id = iy.ilce_id
      GROUP BY i.ilce_id, i.ilce_adi
      LIMIT 15
    `;
    
    const [rows] = await pool.query(query);
    res.json(rows);
    
  } catch (error) {
    console.error("Districts SQL Hatası:", error);
    res.status(500).json({ error: "Veritabanı sorgu hatası" });
  }
});

// --- 2. ÖZET BİLGİLER ---
router.get("/summary", async (req, res) => {
  try {
    res.json({
      totalRevenue: "₺1.2M",
      avgOccupancy: "%76",
      totalRooms: "1,250",
      totalStaff: "340"
    });
  } catch (error) {
    res.status(500).json({ error: "Özet veri hatası" });
  }
});

// --- 3. TREND VERİLERİ (DÜZELTİLDİ: Çarpan Kaldırıldı) ---
router.get("/trends/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const limit = parseInt(req.query.limit) || 6; 

  try {
    const query = `
      SELECT 
        DATE_FORMAT(d.donem_tarihi, '%b %y') as name,
        
        -- DÜZELTME: * 500 çarpanı kaldırıldı!
        SUM(iy.toplam_is_birimi) as revenue, 
        
        ROUND(AVG(iy.doluluk_orani), 0) as occupancy,
        
        -- DÜZELTME: Verimlilik için de çarpan kaldırıldı!
        ROUND(SUM(iy.toplam_is_birimi) / NULLIF(SUM(iy.personel_sayi), 0), 0) as productivity
      
      FROM is_yuku iy
      JOIN donemler d ON iy.donem_id = d.donem_id
      WHERE iy.ilce_id = ?
      GROUP BY d.donem_id, d.donem_tarihi
      ORDER BY d.donem_tarihi DESC 
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [districtId, limit]);
    res.json(rows.reverse());

  } catch (error) {
    console.error("Trend Hatası:", error);
    res.status(500).json({ error: "Trend verisi çekilemedi" });
  }
});

// --- 4. KDS ANALİZ VERİSİ (DÜZELTİLDİ: Risk Mantığı) ---
router.get("/kds-analytics/:districtId", async (req, res) => {
  const { districtId } = req.params;

  try {
    const query = `
      SELECT 
        d.departman_adi as name,
        iy.personel_sayi as mevcut,
        CEIL(iy.toplam_is_birimi / d.hedef_verimlilik) as baseOneri, 
        iy.fazla_mesai_saati as overtime,
        160 as normal,
        iy.turnover_orani as turnover,
        
        -- DÜZELTME: Büyüktür (>) yerine Büyük Eşittir (>=) yaptık.
        -- DÜZELTME: Risk sadece istifaya değil, MESAİYE de bağlıdır!
        CASE 
            -- Eğer Turnover %12'den fazlaysa VEYA Mesai 45 saati geçerse -> KRİTİK (Kırmızı)
            WHEN iy.turnover_orani >= 12 OR iy.fazla_mesai_saati >= 45 THEN 'KRİTİK'
            
            -- Eğer Turnover %6'dan fazlaysa VEYA Mesai 25 saati geçerse -> YÜKSEK (Sarı)
            WHEN iy.turnover_orani >= 6 OR iy.fazla_mesai_saati >= 25 THEN 'YÜKSEK'
            
            ELSE 'DÜŞÜK' -- (Yeşil)
        END as risk,

        iy.personel_sayi as z
      FROM is_yuku iy
      JOIN departmanlar d ON iy.departman_id = d.departman_id
      WHERE iy.ilce_id = ? AND iy.donem_id = 102
    `;

    const dId = (districtId && districtId !== 'null' && districtId !== 'undefined') ? districtId : 5;

    const [rows] = await pool.query(query, [dId]);
    res.json(rows.length > 0 ? rows : []);

  } catch (error) {
    console.error("KDS Analytics Hatası:", error);
    res.status(500).json({ error: "Analiz verisi çekilemedi" });
  }
});

export default router;