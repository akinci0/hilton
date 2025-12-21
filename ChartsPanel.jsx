import React, { useState, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// --- TASARIM SABİTLERİ (THEME) ---
const THEME = {
  colors: {
    primary: "#3b82f6",   // Mavi
    danger: "#ef4444",    // Kırmızı
    success: "#10b981",   // Yeşil
    warning: "#f59e0b",   // Turuncu
    textMain: "#f8fafc",  // Beyazımsı
    textSub: "#94a3b8",   // Gri
    bgDark: "#0f172a",    // Arkaplan
    cardBg: "#1e293b",    // Kart Rengi
    border: "#334155",    // Kenarlık
  },
  cardStyle: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "24px",
    marginBottom: "20px"
  },
  titleStyle: {fontSize: "18px", fontWeight: "700", color: "#f8fafc", marginBottom: "6px", letterSpacing:"-0.025em"},
  subTitleStyle: {fontSize: "13px", color: "#94a3b8", fontWeight: "500", lineHeight: "1.4"}
};

// TARİH ÇEVİRİSİ
const translateDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const monthMap = {
    "Jan": "Oca", "Feb": "Şub", "Mar": "Mar", "Apr": "Nis", "May": "May", "Jun": "Haz",
    "Jul": "Tem", "Aug": "Ağu", "Sep": "Eyl", "Oct": "Eki", "Nov": "Kas", "Dec": "Ara"
  };
  const parts = dateStr.split(" ");
  if (parts.length === 2) {
    const [month, year] = parts;
    return `${monthMap[month] || month} ${year}`;
  }
  return dateStr;
};

// SLIDER STİLİ
const sliderStyles = `
  .kds-range-input { -webkit-appearance: none; width: 100%; height: 6px; background: #334155; border-radius: 3px; outline: none; }
  .kds-range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; transition: all 0.2s; border: 2px solid #1e293b; }
  .thumb-danger::-webkit-slider-thumb { background: ${THEME.colors.danger}; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2); }
  .thumb-primary::-webkit-slider-thumb { background: ${THEME.colors.primary}; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
  .thumb-success::-webkit-slider-thumb { background: ${THEME.colors.success}; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); }
`;

// TOOLTIP
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isScatter = payload[0].payload.z !== undefined;
    const displayLabel = isScatter ? payload[0].payload.name : translateDate(label);

    return (
      <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: `1px solid ${THEME.colors.border}`, padding: "16px", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)", minWidth:"200px" }}>
        <p style={{ color: THEME.colors.textMain, marginBottom: "12px", fontSize:"14px", fontWeight:"700", borderBottom:`1px solid ${THEME.colors.border}`, paddingBottom:'8px' }}>
          {displayLabel}
        </p>
        {payload.map((p, idx) => (
          <div key={idx} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', fontSize:"13px" }}>
            <div style={{width:8, height:8, borderRadius:'50%', backgroundColor: p.color || p.payload.fill}}></div>
            <span style={{color: THEME.colors.textSub}}>{p.name}:</span>
            <span style={{ fontWeight: "700", color: THEME.colors.textMain, marginLeft:'auto' }}>
              {p.dataKey === 'revenue' ? `₺${Number(p.value).toLocaleString()}` : p.value}
              {p.dataKey === 'occupancy' ? '%' : ''}
              {p.name.includes('Saat') ? ' sa' : ''}
              {p.name.includes('Oranı') ? '%' : ''}
            </span>
          </div>
        ))}
        {isScatter && (
           <div style={{marginTop:'8px', fontSize:'12px', color:THEME.colors.warning, fontStyle:'italic'}}>
             Risk Seviyesi: {payload[0].payload.risk}
           </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ChartsPanel({ trendData, kdsData, selectedPeriod, onPeriodChange }) {
  const chartData = trendData || [];
  const rawKdsData = kdsData || []; 

  const simulationRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!simulationRef.current) return;
    try {
      const canvas = await html2canvas(simulationRef.current, {
        scale: 2, 
        backgroundColor: THEME.colors.cardBg 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.setFontSize(14);
      pdf.text("Hilton Izmir - Stratejik Personel Planlama Raporu", 10, 10);
      pdf.setFontSize(10);
      pdf.text(`Rapor Tarihi: ${new Date().toLocaleDateString()}`, 10, 16);
      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, imgHeight);
      pdf.save(`Hilton_KDS_Rapor_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (err) {
      console.error("PDF Hatası:", err);
      alert("Rapor oluşturulurken bir hata oluştu.");
    }
  };

  const isLoading = rawKdsData.length === 0 && chartData.length === 0;
  const safeKdsData = rawKdsData.length > 0 ? rawKdsData : [
    { name: "...", mevcut: 0, baseOneri: 0, overtime: 0, turnover: 0, z:0, risk:"-" }
  ];

  const [occScenario, setOccScenario] = useState(0); 
  const [prodTarget, setProdTarget] = useState(100); 
  const [avgCost, setAvgCost] = useState(35000);

  const simulatedDeptData = useMemo(() => {
    return safeKdsData.map(dept => {
      const occFactor = 1 + (occScenario / 100);
      const prodFactor = prodTarget / 100;
      const newOneri = Math.ceil((dept.baseOneri * occFactor) / prodFactor);
      return { ...dept, onerilen: newOneri, gap: newOneri - dept.mevcut };
    });
  }, [occScenario, prodTarget, safeKdsData]);

  const overtimeData = safeKdsData;
  const riskMatrixData = safeKdsData.map(d => ({
    name: d.name,
    x: d.overtime, 
    y: d.turnover, 
    z: d.z || 10,
    risk: d.risk,
    fill: d.risk === 'KRİTİK' ? THEME.colors.danger : d.risk === 'YÜKSEK' ? THEME.colors.warning : THEME.colors.success
  }));

  // --- HESAPLAMA MANTIĞI GÜNCELLENDİ ---
  const totalGap = simulatedDeptData.reduce((acc, curr) => acc + (curr.onerilen - curr.mevcut), 0);
  
  // Pozitif ise (Alım Lazım), Negatif ise (Fazla Personel Var)
  const isHiring = totalGap >= 0;
  const gapValue = Math.abs(totalGap); // Ekrana hep pozitif sayı yazacağız
  const estCost = gapValue * avgCost;

  // Tasarım renklerini duruma göre değiştir
  const statusColor = isHiring ? THEME.colors.danger : THEME.colors.success; // Alım=Kırmızı(Maliyet), Çıkarma=Yeşil(Tasarruf)
  const statusBg = isHiring ? `${THEME.colors.danger}15` : `${THEME.colors.success}15`;
  const statusBorder = isHiring ? THEME.colors.danger : THEME.colors.success;

  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} vertical={false} opacity={0.4} />;
  const commonXAxis = <XAxis dataKey="name" stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textSub, fontSize: 12, fontWeight:500 }} tickLine={false} axisLine={false} dy={10} tickFormatter={translateDate} />;
  const commonYAxis = <YAxis stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textSub, fontSize: 12, fontWeight:500 }} tickLine={false} axisLine={false} />;

  const chartGradients = (
    <defs>
      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.danger} stopOpacity={0.8}/><stop offset="95%" stopColor={THEME.colors.danger} stopOpacity={0.1}/></linearGradient>
      <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.success} stopOpacity={0.8}/><stop offset="95%" stopColor={THEME.colors.success} stopOpacity={0.1}/></linearGradient>
      <linearGradient id="barPrimary" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={THEME.colors.primary} stopOpacity={1}/><stop offset="100%" stopColor="#60a5fa" stopOpacity={1}/></linearGradient>
      <linearGradient id="barDanger" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={THEME.colors.danger} stopOpacity={1}/><stop offset="100%" stopColor="#f87171" stopOpacity={1}/></linearGradient>
    </defs>
  );

  const getBtnStyle = (period) => ({
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    backgroundColor: selectedPeriod === period ? THEME.colors.primary : "rgba(255,255,255,0.05)",
    color: selectedPeriod === period ? "#fff" : THEME.colors.textSub,
    marginLeft: "4px"
  });

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: THEME.colors.textSub }}>
        <div style={{ marginBottom: "10px", fontSize: "24px" }}>⏳</div>
        <p>Veriler Analiz Ediliyor...</p>
        <small>Lütfen bekleyiniz veya haritadan bir şube seçiniz.</small>
      </div>
    );
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'24px', marginTop:'24px', fontFamily: "'Inter', sans-serif"}}>
      <style>{sliderStyles}</style>
      
      {/* 1. BLOK: TRENDLER */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Gelir Grafiği */}
        <div style={THEME.cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems:"center" }}>
            <div>
                <h3 style={THEME.titleStyle}>Gelir ve Doluluk Trendi</h3>
                <p style={THEME.subTitleStyle}>Geçmiş ve Gelecek Dönem Analizi</p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "8px" }}>
                <button onClick={() => onPeriodChange(6)} style={getBtnStyle(6)}>6 Ay</button>
                <button onClick={() => onPeriodChange(12)} style={getBtnStyle(12)}>12 Ay</button>
                <button onClick={() => onPeriodChange(18)} style={getBtnStyle(18)}>18 Ay</button>
            </div>
          </div>
          
          <div style={{ width: "100%", height: 300 }}>
             {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    {chartGradients}{commonGrid}{commonXAxis}
                    <YAxis yAxisId="left" stroke={THEME.colors.textSub} tickFormatter={(val)=>`₺${val/1000}k`} tickLine={false} axisLine={false}/>
                    <YAxis yAxisId="right" orientation="right" stroke={THEME.colors.textSub} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" name="Gelir" stroke={THEME.colors.danger} strokeWidth={3} dot={false} fill="url(#colorRevenue)" />
                    <Line yAxisId="right" type="monotone" dataKey="occupancy" name="Doluluk" stroke={THEME.colors.success} strokeWidth={3} dot={false} fill="url(#colorOccupancy)" />
                  </LineChart>
                </ResponsiveContainer>
             ) : (
                 <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:THEME.colors.textSub}}>Trend verisi yok</div>
             )}
          </div>
        </div>

        {/* Verimlilik Grafiği */}
        <div style={THEME.cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems:"center" }}>
            <div>
                <h3 style={THEME.titleStyle}>Personel Verimlilik Trendi</h3>
                <p style={THEME.subTitleStyle}>Personel başına düşen gelir</p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "8px" }}>
                <button onClick={() => onPeriodChange(6)} style={getBtnStyle(6)}>6 Ay</button>
                <button onClick={() => onPeriodChange(12)} style={getBtnStyle(12)}>12 Ay</button>
                <button onClick={() => onPeriodChange(18)} style={getBtnStyle(18)}>18 Ay</button>
            </div>
          </div>
          
          <div style={{ width: "100%", height: 300 }}>
             {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    {commonGrid}{commonXAxis}{commonYAxis}
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={12000} label={{ value: "HEDEF", fill: THEME.colors.warning, fontSize: 10, position: 'insideTopRight' }} stroke={THEME.colors.warning} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="productivity" name="Pers. Başına Gelir (₺)" stroke={THEME.colors.warning} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             ) : (
                 <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:THEME.colors.textSub}}>Veri yok</div>
             )}
          </div>
        </div>
      </div>

      {/* 2. BLOK: RİSK VE MESAİ ANALİZİ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={THEME.cardStyle}>
          <div style={{ marginBottom: "20px" }}>
             <h3 style={THEME.titleStyle}>Mevcut İş Yükü (Overtime)</h3>
             <p style={THEME.subTitleStyle}>Yasal çalışma saati sınırlarını aşma durumu</p>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={overtimeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                {chartGradients}{commonGrid}{commonYAxis}
                <XAxis dataKey="name" stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textSub, fontSize: 11, fontWeight:500 }} tickLine={false} axisLine={false} dy={10} interval={0} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={180} label={{ value: "LİMİT", fill: THEME.colors.danger, fontSize: 10, position: 'insideTopRight' }} stroke={THEME.colors.danger} strokeDasharray="4 4" />
                <Bar dataKey="normal" stackId="a" name="Normal Mesai" fill="url(#barPrimary)" barSize={32} />
                <Bar dataKey="overtime" stackId="a" name="Fazla Mesai (Risk)" fill="url(#barDanger)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={THEME.cardStyle}>
          <div style={{ marginBottom: "20px" }}>
             <h3 style={THEME.titleStyle}>Personel Risk Matrisi ⚠️</h3>
             <p style={THEME.subTitleStyle}>İş Yükü vs. İstifa Oranı (Turnover) Analizi</p>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} opacity={0.4} />
                <XAxis type="number" dataKey="x" name="Fazla Mesai (Saat)" stroke={THEME.colors.textSub} tick={{fontSize:12}} label={{ value: 'Fazla Mesai (Yorgunluk)', position: 'insideBottom', offset: -20, fill: THEME.colors.textSub, fontSize:11 }} />
                <YAxis type="number" dataKey="y" name="Turnover Oranı (%)" stroke={THEME.colors.textSub} tick={{fontSize:12}} label={{ value: 'İstifa Oranı (%)', angle: -90, position: 'insideLeft', fill: THEME.colors.textSub, fontSize:11 }} />
                <ZAxis type="number" dataKey="z" range={[100, 500]} name="Personel Sayısı" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={30} stroke={THEME.colors.textSub} strokeDasharray="3 3" label={{position:'top', value:'RİSK EŞİĞİ', fontSize:10, fill:THEME.colors.textSub}} />
                <ReferenceLine y={10} stroke={THEME.colors.textSub} strokeDasharray="3 3" />
                <Scatter name="Departmanlar" data={riskMatrixData} shape="circle">
                  {riskMatrixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={THEME.colors.cardBg} strokeWidth={2} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{marginTop:'12px', fontSize:'11px', color:THEME.colors.textSub, textAlign:'center'}}>
              * Sağ üst köşedeki departmanlar (Kırmızı) hem çok çalışıyor hem de ekibi kaybediyor. Acil müdahale gerektirir.
            </div>
          </div>
        </div>
      </div>

      {/* 3. BLOK: SİMÜLASYON VE PDF ALANI */}
      <div ref={simulationRef} style={{...THEME.cardStyle, border: `1px solid ${THEME.colors.danger}30`, position:'relative'}}>
         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems:'flex-start' }}>
            <div>
              <h3 style={{...THEME.titleStyle, color: THEME.colors.danger, display:'flex', alignItems:'center', gap:'8px'}}>
                 ⚡ KDS Personel Planlama Simülasyonu
              </h3>
              <p style={THEME.subTitleStyle}>Parametreleri değiştirerek senaryo analizi yapın (What-If Analysis)</p>
            </div>
             
             <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
               <button 
                  onClick={handleDownloadPDF}
                  style={{
                    padding:'6px 16px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.2)', 
                    background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize:'13px', fontWeight:'600',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
               >
                 📄 Rapor İndir
               </button>

               <div style={{ display:'flex', alignItems:'center', gap:'16px', fontSize:'13px', color: THEME.colors.textSub, background: THEME.colors.bgDark, padding:'8px 16px', borderRadius:'20px' }}>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:12, height:12, borderRadius:'4px', background: THEME.colors.primary}}></div> Mevcut</div>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}><div style={{width:12, height:12, borderRadius:'4px', background: THEME.colors.danger}}></div> Önerilen</div>
               </div>
             </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'24px', padding:'24px', background: `${THEME.colors.bgDark}80`, borderRadius:'12px', marginBottom:'24px', border: `1px solid ${THEME.colors.border}` }}>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                <label style={{fontSize:'13px', fontWeight:'600', color: THEME.colors.textMain}}>Beklenen Doluluk Artışı</label>
                <span style={{fontSize:'14px', color: THEME.colors.danger, fontWeight:'800', padding:'2px 8px', background:`${THEME.colors.danger}20`, borderRadius:'6px'}}>{occScenario > 0 ? `+${occScenario}%` : `${occScenario}%`}</span>
              </div>
              <input type="range" min="-20" max="30" step="5" value={occScenario} onChange={(e) => setOccScenario(Number(e.target.value))} className="kds-range-input thumb-danger" />
            </div>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                <label style={{fontSize:'13px', fontWeight:'600', color: THEME.colors.textMain}}>Verimlilik Hedefi</label>
                <span style={{fontSize:'14px', color: THEME.colors.primary, fontWeight:'800', padding:'2px 8px', background:`${THEME.colors.primary}20`, borderRadius:'6px'}}>%{prodTarget}</span>
              </div>
              <input type="range" min="80" max="120" step="5" value={prodTarget} onChange={(e) => setProdTarget(Number(e.target.value))} className="kds-range-input thumb-primary" />
            </div>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
                <label style={{fontSize:'13px', fontWeight:'600', color: THEME.colors.textMain}}>Ort. Personel Maliyeti</label>
                <span style={{fontSize:'14px', color: THEME.colors.success, fontWeight:'800', padding:'2px 8px', background:`${THEME.colors.success}20`, borderRadius:'6px'}}>₺{avgCost.toLocaleString()}</span>
              </div>
              <input type="range" min="20000" max="60000" step="1000" value={avgCost} onChange={(e) => setAvgCost(Number(e.target.value))} className="kds-range-input thumb-success" />
            </div>
          </div>

          <div style={{ width: "100%", height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={simulatedDeptData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                {chartGradients}
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} horizontal={true} vertical={false} opacity={0.4} />
                <XAxis type="number" stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textSub, fontSize: 12, fontWeight:500 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textMain, fontSize: 13, fontWeight:600 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mevcut" name="Mevcut Kadro" fill="url(#barPrimary)" radius={[0, 6, 6, 0]} barSize={24} />
                <Bar dataKey="onerilen" name="Simülasyon Sonucu" fill="url(#barDanger)" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* --- YÖNETİCİ ÖZETİ (GÜNCELLENDİ) --- */}
          <div style={{marginTop: 24, padding: "20px", background: statusBg, borderRadius: "12px", borderLeft: `4px solid ${statusBorder}`}}>
            <h4 style={{margin: '0 0 8px 0', color: statusBorder, fontSize: 15, fontWeight: 700, display:'flex', alignItems:'center', gap:'8px'}}>
               📊 Yönetici Özeti (Karar Destek Çıktısı)
            </h4>
            <div style={{color: THEME.colors.textMain, fontSize: 14, lineHeight: '1.6'}}>
               Operasyonel sürdürülebilirlik için toplam <strong style={{color: THEME.colors.textMain, background: `${statusBorder}30`, padding:'2px 6px', borderRadius:'4px'}}>
                 {gapValue} {isHiring ? "yeni personel" : "personel"}
               </strong> {isHiring ? "alımını" : "azaltımını / norm fazlasını"} işaret etmektedir. 
               
               <br />
               {isHiring ? "Tahmini Aylık Ek Bütçe Yükü: " : "Tahmini Aylık Personel Tasarrufu: "}
               <strong style={{color: statusBorder}}>₺{estCost.toLocaleString()}</strong>
            </div>
          </div>
      </div>
    </div>
  );
}