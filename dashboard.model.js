import { pool } from "../db.js";

export async function getDistrictCards() {
  const [rows] = await pool.query(`
    SELECT
      i.ilce_id AS districtId,
      i.ilce_adi AS name,
      ROUND(AVG(iy.doluluk_orani), 0) AS occupancy
    FROM ilceler i
    LEFT JOIN is_yuku iy ON iy.ilce_id = i.ilce_id
    GROUP BY i.ilce_id, i.ilce_adi
    ORDER BY occupancy DESC
  `);

  return rows.map((r) => ({
  districtId: Number(r.districtId ?? r.ilce_id ?? r.bolgeKimligi ?? r.id),
  name: String(r.name ?? r.ilce_adi ?? r.ad ?? r.isim),
  occupancy: Number(r.occupancy ?? r.doluluk ?? r.isgal ?? 0),
  score: r.score ?? r.puan ?? null,
}));

}
