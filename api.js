// src/lib/api.js
const BASE_URL = "http://localhost:5001"; 

// 1. ŞUBE LİSTESİ VE HARİTA 
export async function fetchDistricts() {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/districts`);
    if (!res.ok) throw new Error("Districts fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Districts Error:", error);
    return [];
  }
}

// 2. ÖZET BİLGİLER
export async function fetchSummary() {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/summary`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Summary Error:", error);
    return null;
  }
}

// 3. TREND VERİLERİ (Düzeltildi: Limit parametresi eklendi, eski kopya silindi)
export async function fetchDistrictTrends(districtId, limit = 6) {
  try {
    // Limit parametresini (6, 12, 18) URL'ye ekliyoruz
    const res = await fetch(`${BASE_URL}/api/dashboard/trends/${districtId}?limit=${limit}`);
    if (!res.ok) throw new Error("Trend fetch failed");
    return await res.json();
  } catch (error) {
    console.error("Trend Data Error:", error);
    return [];
  }
}

// 4. KDS ANALİZ VERİSİ
export async function fetchKdsData(districtId) {
  try {
    const res = await fetch(`${BASE_URL}/api/dashboard/kds-analytics/${districtId}`);
    if (!res.ok) return []; 
    return await res.json();
  } catch (error) {
    console.error("KDS Data hatası:", error);
    return [];
  }
}