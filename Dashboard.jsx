import React, { useEffect, useMemo, useState } from "react";
import IzmirChoropleth from "../components/IzmirChoropleth.jsx";
import DistrictList from "../components/DistrictList.jsx";
import ChartsPanel from "../components/ChartsPanel.jsx";
import { fetchDistricts, fetchSummary, fetchDistrictTrends, fetchKdsData } from "../lib/api";

// Logo'nun src/assets içinde olduğunu varsayıyoruz
import hiltonLogo from './hilton.png'; 

// İstatik Kartı Bileşeni
function StatCard({ title, value, foot, icon }) {
  return (
    <div className="card statCard">
      <div className="statTop">
        <span>{title}</span>
        <span>{icon}</span>
      </div>
      <div className="statValue">{value}</div>
      <div className="statFoot">{foot}</div>
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  
  // --- STATE TANIMLARI ---
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(5); // Varsayılan: Çeşme
  const [selectedPeriod, setSelectedPeriod] = useState(6); // Varsayılan: 6 Ay
  
  // Grafik Verileri
  const [kdsData, setKdsData] = useState([]);     
  const [trendData, setTrendData] = useState([]); 
  const [summary, setSummary] = useState(null);
  
  // UI State
  const [error, setError] = useState("");
  const [tab, setTab] = useState("map");

  // --- YENİ EKLENEN: EXCEL (CSV) İNDİRME FONKSİYONU ---
  const handleDownloadExcel = () => {
    // 1. Başlık Satırı
    let csvContent = "Şube Adı;Doluluk Oranı (%);Performans Puanı;Durum\n";

    // 2. Verileri Döngüye Alıp Satır Satır Ekleme
    districts.forEach(d => {
      const score = Number(d.score || 0);
      let statusLabel = "Düşük";
      if (score >= 4.7) statusLabel = "Mükemmel";
      else if (score >= 4.5) statusLabel = "İyi";
      else if (score >= 4.0) statusLabel = "Orta";

      // Excel'in sütunları ayırması için noktalı virgül (;) kullanıyoruz
      // Türkçe Excel versiyonları genelde virgül yerine noktalı virgül sever.
      const row = `"${d.name}";${Math.round(d.occupancy)};${score.toFixed(1)};"${statusLabel}"`;
      csvContent += row + "\n";
    });

    // 3. Dosyayı Oluşturma (Türkçe karakterler için BOM \uFEFF ekliyoruz)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    
    // 4. İndirme Linki Oluşturup Tıklama
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Hilton_Subeler_Raporu_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EFFECT 1: Sayfa İlk Açıldığında ---
  useEffect(() => {
    async function loadInitialData() {
      try {
        const d = await fetchDistricts();
        setDistricts(d);
        const s = await fetchSummary();
        setSummary(s);

        if (!selectedDistrictId && d.length > 0) {
           setSelectedDistrictId(d[0].districtId); 
        }
      } catch (err) {
        console.error("Başlangıç verisi hatası:", err);
        setError("Veri yüklenirken hata oluştu.");
      }
    }
    loadInitialData();
  }, []);

  // --- EFFECT 2: İlçe veya Periyot Değişince ---
  useEffect(() => {
    if (!selectedDistrictId) return;

    async function loadDetails() {
      try {
        const trends = await fetchDistrictTrends(selectedDistrictId, selectedPeriod);
        setTrendData(trends); 

        const kds = await fetchKdsData(selectedDistrictId);
        setKdsData(kds);
      } catch (err) {
        console.error("Detay veri hatası:", err);
      }
    }
    loadDetails();
  }, [selectedDistrictId, selectedPeriod]);

  // Seçili ilçeyi bul
  const selected = useMemo(
    () => districts.find((d) => Number(d.districtId) === Number(selectedDistrictId)),
    [districts, selectedDistrictId]
  );

  const cards = {
    totalRevenue: summary?.totalRevenue ?? "₺0",
    avgOccupancy: summary?.avgOccupancy ?? "%0",
    totalRooms: summary?.totalRooms ?? "0",
    totalStaff: summary?.totalStaff ?? "0",
  };

  return (
    <div className="container">
      {/* HEADER ALANI */}
      <div className="headerRow">
        <img
          src={hiltonLogo}
          alt="Hilton Logo"
          style={{
            width: '120px', 
            height: 'auto', 
            marginRight: '15px',
          }}
        />

        <div>
          <h1 className="hTitle">Hilton Hotel İzmir</h1>
          <p className="hSub">Personel Karar Destek Sistemi</p>
        </div>

        {error ? <span className="errText">{error}</span> : null}

        {/* --- ÇIKIŞ YAP BUTONU --- */}
        <button 
          onClick={onLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "auto",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          Çıkış Yap
        </button>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="statsGrid">
        <StatCard title="Toplam Gelir (Yıllık)" value={cards.totalRevenue} foot="Geçen yıla göre +%12" icon="$" />
        <StatCard title="Ortalama Doluluk" value={cards.avgOccupancy} foot="Sezon ortalaması" icon="↗" />
        <StatCard title="Toplam Oda Kapasitesi" value={cards.totalRooms} foot="Tüm şubeler" icon="▣" />
        <StatCard title="Toplam Personel" value={cards.totalStaff} foot="Şu an çalışan" icon="👤" />
      </div>

      {/* TAB BUTONLARI */}
      <div className="tabsRow">
        <button className={`tabBtn ${tab === "map" ? "tabBtnActive" : ""}`} onClick={() => setTab("map")}>
          Yönetici Paneli (Harita)
        </button>
        <button className={`tabBtn ${tab === "list" ? "tabBtnActive" : ""}`} onClick={() => setTab("list")}>
          Veri Listesi
        </button>
      </div>

      {/* --- ANA İÇERİK DEĞİŞİMİ --- */}
      {tab === "map" ? (
        // === 1. SEKME: HARİTA GÖRÜNÜMÜ ===
        <>
          <div className="mainGrid">
            {/* SOL: HARİTA */}
            <div className="card panel">
              <h3 className="panelTitle">İzmir Haritası</h3>
              <div className="mapFrame">
                <IzmirChoropleth
                  districts={districts}
                  selectedDistrictId={selectedDistrictId}
                  onSelectDistrict={setSelectedDistrictId}
                />
              </div>
            </div>

            {/* SAĞ: ŞUBE LİSTESİ */}
            <div className="card panel">
              <h3 className="panelTitle">Şubeler</h3>
              <p className="panelSub">Analiz için bir şube seçin</p>
              <div className="listWrap">
                <DistrictList
                    items={districts}
                    activeId={selectedDistrictId}
                    onSelect={(id) => setSelectedDistrictId(Number(id))}
                />
              </div>
            </div>
          </div>

          {/* ALT: DETAY GRAFİKLERİ */}
          <div style={{ marginTop: "14px" }}>
            {selected ? (
              <>
                <div className="card panel" style={{borderBottomLeftRadius:0, borderBottomRightRadius:0, paddingBottom:0, borderBottom:'none'}}>
                    <h3 className="panelTitle" style={{ fontSize: '20px', color:'#f0e6e4' }}>
                    {selected.name} Şubesi - Stratejik Planlama
                    </h3>
                    <p className="panelSub">
                    Canlı veriler ve geçmiş dönem analizleri.
                    </p>
                </div>
                
                <ChartsPanel 
                   trendData={trendData} 
                   kdsData={kdsData} 
                   selectedPeriod={selectedPeriod}
                   onPeriodChange={setSelectedPeriod}
                />
              </>
            ) : (
              <div className="card panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "250px", opacity: 0.7, textAlign: "center" }}>
                <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>
                  Veriler Yükleniyor...
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // === 2. SEKME: DETAYLI TABLO GÖRÜNÜMÜ ===
        <div className="card panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 className="panelTitle">Tüm Şubeler Detaylı Liste</h3>
            
            {/* EXCEL İNDİR BUTONU - ARTIK ÇALIŞIYOR */}
            <button 
              onClick={handleDownloadExcel}
              style={{ 
                padding: "8px 16px", 
                background: "#10b981", // Yeşil renk (Excel'i çağrıştırır) 
                color: "#fff", 
                border: "none", 
                borderRadius: "6px", 
                fontSize: "13px", 
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📥 Excel İndir
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #334155" }}>
                  <th style={{ padding: "12px", color: "#94a3b8" }}>ŞUBE ADI</th>
                  <th style={{ padding: "12px", color: "#94a3b8" }}>DOLULUK</th>
                  <th style={{ padding: "12px", color: "#94a3b8" }}>PERFORMANS PUANI</th>
                  <th style={{ padding: "12px", color: "#94a3b8" }}>DURUM</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d, idx) => {
                  const score = Number(d.score || 0);
                  let status = { label: "Düşük", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
                  
                  if (score >= 4.7) status = { label: "Mükemmel", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
                  else if (score >= 4.5) status = { label: "İyi", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" };
                  else if (score >= 4.0) status = { label: "Orta", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #334155", transition: "background 0.2s" }} 
                        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "16px", fontWeight: "600", color: "#f8fafc" }}>
                        {d.name}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "100px", height: "6px", background: "#334155", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${d.occupancy}%`, height: "100%", background: status.color }}></div>
                          </div>
                          <span>%{Math.round(d.occupancy)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontWeight: "bold" }}>
                        {Number(d.score).toFixed(1)} / 5.0
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          padding: "4px 10px", 
                          borderRadius: "6px", 
                          background: status.bg, 
                          color: status.color, 
                          fontSize: "12px", 
                          fontWeight: "700" 
                        }}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}