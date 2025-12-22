import React, { useEffect, useMemo, useState } from "react";
import IzmirChoropleth from "../components/IzmirChoropleth.jsx";
import DistrictList from "../components/DistrictList.jsx";
import ChartsPanel from "../components/ChartsPanel.jsx";
import { fetchDistricts, fetchSummary, fetchDistrictTrends, fetchKdsData } from "../lib/api";

import hiltonLogo from './hilton.png'; 

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
  
  // 1. DEĞİŞİKLİK: Başlangıç değeri 'null' yapıldı (Artık Çeşme seçili gelmeyecek)
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null); 
  const [selectedPeriod, setSelectedPeriod] = useState(6); 
  
  const [kdsData, setKdsData] = useState([]);     
  const [trendData, setTrendData] = useState([]); 
  const [summary, setSummary] = useState(null);
  
  const [error, setError] = useState("");
  const [tab, setTab] = useState("map");

  const handleDownloadExcel = () => {
    let csvContent = "Şube Adı;Doluluk Oranı (%);Performans Puanı;Durum\n";
    districts.forEach(d => {
      const score = Number(d.score || 0);
      let statusLabel = "Düşük";
      if (score >= 4.7) statusLabel = "Mükemmel";
      else if (score >= 4.5) statusLabel = "İyi";
      else if (score >= 4.0) statusLabel = "Orta";
      const row = `"${d.name}";${Math.round(d.occupancy)};${score.toFixed(1)};"${statusLabel}"`;
      csvContent += row + "\n";
    });
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Hilton_Subeler_Raporu_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const d = await fetchDistricts();
        setDistricts(d);
        const s = await fetchSummary();
        setSummary(s);
        
        // 2. DEĞİŞİKLİK: Otomatik seçim kodu kaldırıldı.
        // if (!selectedDistrictId && d.length > 0) { setSelectedDistrictId(d[0].districtId); } -> SİLİNDİ

      } catch (err) {
        console.error("Başlangıç verisi hatası:", err);
        setError("Veri yüklenirken hata oluştu.");
      }
    }
    loadInitialData();
  }, []);

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
      <div className="headerRow">
        <img
          src={hiltonLogo}
          alt="Hilton Logo"
          style={{ width: '120px', height: 'auto', marginRight: '15px' }}
        />
        <div>
          <h1 className="hTitle">Hilton Hotel İzmir</h1>
          <p className="hSub">Personel Karar Destek Sistemi</p>
        </div>
        {error ? <span className="errText">{error}</span> : null}
        <button 
          onClick={onLogout}
          style={{
            padding: "8px 16px", backgroundColor: "#ef4444", color: "white", border: "none",
            borderRadius: "8px", cursor: "pointer", fontWeight: "bold", marginLeft: "auto",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          Çıkış Yap
        </button>
      </div>

      <div className="statsGrid">
        <StatCard title="Toplam Gelir (Yıllık)" value={cards.totalRevenue} foot="Geçen yıla göre +%12" icon="$" />
        <StatCard title="Ortalama Doluluk" value={cards.avgOccupancy} foot="Sezon ortalaması" icon="↗" />
        <StatCard title="Toplam Oda Kapasitesi" value={cards.totalRooms} foot="Tüm şubeler" icon="▣" />
        <StatCard title="Toplam Personel" value={cards.totalStaff} foot="Şu an çalışan" icon="👤" />
      </div>

      <div className="tabsRow">
        <button className={`tabBtn ${tab === "map" ? "tabBtnActive" : ""}`} onClick={() => setTab("map")}>
          Yönetici Paneli (Harita)
        </button>
        <button className={`tabBtn ${tab === "list" ? "tabBtnActive" : ""}`} onClick={() => setTab("list")}>
          Veri Listesi
        </button>
      </div>

      {tab === "map" ? (
        <>
          <div className="mainGrid">
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

          <div style={{ marginTop: "14px" }}>
            {selected ? (
              <>
                {/* --- SEÇİM YAPILDIĞINDA GÖRÜNECEK ALAN --- */}
                <div className="card panel" style={{
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    paddingBottom: 16,
                    borderBottom: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div>
                        <h3 className="panelTitle" style={{ fontSize: '20px', color: '#f0e6e4', display:'flex', alignItems:'center', gap:'8px' }}>
                           📍 {selected.name} Şubesi - Stratejik Planlama
                        </h3>
                        <p className="panelSub" style={{ margin: '4px 0 0 0' }}>
                           Canlı veriler ve geçmiş dönem analizleri.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding:'6px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Şube Seç:</span>
                        <select
                            value={selectedDistrictId}
                            onChange={(e) => setSelectedDistrictId(Number(e.target.value))}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#f8fafc',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                outline: 'none',
                                minWidth: '120px'
                            }}
                        >
                            {districts.map((d) => (
                                <option key={d.districtId} value={d.districtId} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <ChartsPanel 
                   trendData={trendData} 
                   kdsData={kdsData} 
                   selectedPeriod={selectedPeriod}
                   onPeriodChange={setSelectedPeriod}
                />
              </>
            ) : (
              // --- 3. DEĞİŞİKLİK: SEÇİM YAPILMADIĞINDA GÖRÜNECEK ŞIK "BOŞ DURUM" EKRANI ---
              <div className="card panel" style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  minHeight: "350px", 
                  textAlign: "center",
                  borderStyle: "dashed",
                  borderColor: "rgba(255,255,255,0.15)",
                  background: "rgba(30, 41, 59, 0.3)" 
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.8 }}>🗺️</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize:'18px' }}>Henüz Bir Şube Seçilmedi</h3>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px", maxWidth: "450px", lineHeight:"1.5" }}>
                  Stratejik analizleri, personel simülasyonunu ve risk raporlarını görüntülemek için lütfen yukarıdaki <strong>Harita</strong> veya <strong>Şube Listesi</strong> üzerinden bir seçim yapınız.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 className="panelTitle">Tüm Şubeler Detaylı Liste</h3>
            <button 
              onClick={handleDownloadExcel}
              style={{ 
                padding: "8px 16px", 
                background: "#10b981", 
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
                      <td style={{ padding: "16px", fontWeight: "600", color: "#f8fafc" }}>{d.name}</td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "100px", height: "6px", background: "#334155", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${d.occupancy}%`, height: "100%", background: status.color }}></div>
                          </div>
                          <span>%{Math.round(d.occupancy)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontWeight: "bold" }}>{Number(d.score).toFixed(1)} / 5.0</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "6px", background: status.bg, color: status.color, fontSize: "12px", fontWeight: "700" }}>
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