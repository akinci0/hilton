import React, { useState, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import regression from 'regression'; 

// --- TASARIM SABİTLERİ ---
const THEME = {
  colors: {
    primary: "#3b82f6",   
    danger: "#ef4444",    
    success: "#10b981",   
    warning: "#f59e0b",   
    purple: "#8b5cf6",
    idle:   "#94a3b8",    
    overtime: "#f97316",  
    ai:     "#d946ef",    
    textMain: "#f8fafc",  
    textSub: "#94a3b8",   
    bgDark: "#0f172a",    
    cardBg: "#1e293b",    
    border: "#334155",    
  },
  cardStyle: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0
  },
  titleStyle: {fontSize: "15px", fontWeight: "700", color: "#f8fafc", marginBottom: "2px", letterSpacing:"-0.025em"},
  subTitleStyle: {fontSize: "11px", color: "#94a3b8", fontWeight: "500", lineHeight: "1.2"}
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
  .kds-range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; cursor: pointer; transition: all 0.2s; border: 2px solid #1e293b; }
  .thumb-danger::-webkit-slider-thumb { background: ${THEME.colors.danger}; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2); }
  .thumb-primary::-webkit-slider-thumb { background: ${THEME.colors.primary}; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
  .thumb-success::-webkit-slider-thumb { background: ${THEME.colors.success}; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); }
  .thumb-warning::-webkit-slider-thumb { background: ${THEME.colors.warning}; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2); }
  .thumb-ai::-webkit-slider-thumb { background: ${THEME.colors.ai}; box-shadow: 0 0 0 6px rgba(217, 70, 239, 0.2); border: 2px solid #fff; } 
  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

// TOOLTIP BİLEŞENİ
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isScatter = payload[0].payload.z !== undefined;
    const isPie = payload[0].name !== undefined && !label;
    const displayLabel = isScatter || isPie ? payload[0].payload.name : translateDate(label);

    const getLabelName = (key) => {
      switch(key) {
        case 'x': return 'Fazla Mesai (Saat)';
        case 'y': return 'İstifa Oranı (%)';
        case 'z': return 'Personel Sayısı';
        case 'revenue': return 'Kâr';
        case 'occupancy': return 'Doluluk';
        case 'productivity': return 'Verimlilik';
        case 'normal': return 'Normal Mesai';
        case 'overtime': return 'Fazla Mesai (Risk)';
        case 'value': return 'Tutar';
        case 'totalBudget': return 'Bütçe';
        default: return key;
      }
    };

    return (
      <div style={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: `1px solid ${THEME.colors.border}`, padding: "12px", borderRadius: "8px", boxShadow: "0 10px 15px -5px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)", minWidth:"180px", zIndex: 100 }}>
        <p style={{ color: THEME.colors.textMain, marginBottom: "8px", fontSize:"13px", fontWeight:"700", borderBottom:`1px solid ${THEME.colors.border}`, paddingBottom:'4px' }}>
          {displayLabel}
        </p>
        {payload.map((p, idx) => (
          <div key={idx} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', fontSize:"12px" }}>
            <div style={{width:6, height:6, borderRadius:'50%', backgroundColor: p.color || p.payload.fill}}></div>
            <span style={{color: THEME.colors.textSub}}>{getLabelName(p.name)}:</span>
            <span style={{ fontWeight: "700", color: THEME.colors.textMain, marginLeft:'auto' }}>
              {p.dataKey === 'revenue' || p.name === 'value' || p.name === 'totalBudget' || p.unit === '₺' ? `₺${Number(p.value).toLocaleString()}` : p.value}
              {p.dataKey === 'occupancy' ? '%' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const COST_COLORS = [THEME.colors.primary, THEME.colors.idle, THEME.colors.overtime];

export default function ChartsPanel({ trendData, kdsData, selectedPeriod, onPeriodChange }) {
  const chartData = trendData || [];
  const rawKdsData = kdsData || []; 

  const reportRef = useRef(null); 

  const [simMode, setSimMode] = useState('recruitment'); 

  // --- PARAMETRELER ---
  const [occScenario, setOccScenario] = useState(0); 
  const [avgCost, setAvgCost] = useState(35000);
  const [prodTarget, setProdTarget] = useState(100); 
  const [flexibleRatio, setFlexibleRatio] = useState(10); 
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(1.5); 
  
  // AI State
  const [aiPrediction, setAiPrediction] = useState(null); 
  const [isAiActive, setIsAiActive] = useState(false);    

  // --- YAPAY ZEKA TAHMİN (MEVSİMSELLİK AKLI EKLENMİŞ VERSİYON) ---
  const handleAiPredict = () => {
    if (!chartData || chartData.length === 0) { alert("Tahmin için veri yok."); return; }

    const cleanData = chartData.map((d) => Number(d.occupancy)).filter((val) => !isNaN(val) && val > 0);
    if (cleanData.length < 3) { alert("Yetersiz veri."); return; }

    const dataPoints = cleanData.map((val, index) => [index, val]);
    const result = regression.linear(dataPoints);
    
    const lastIndex = dataPoints.length - 1;
    const futureIndex = lastIndex + 6; 
    const currentOccupancy = cleanData[lastIndex];
    let linearPrediction = result.predict(futureIndex)[1];

    // TURİZM MANTIĞI: Eğer verilerde ciddi bir düşüş trendi varsa (Kışa giriş) 
    // ama 6 ay sonrası Yaz dönemine denk geliyorsa, lineer tahmine Yaz Bonusu ekle.
    let finalPrediction = linearPrediction;
    
    if (result.equation[0] < 0) { // Trend aşağı yönlüyse (Sezon sonu)
        // 6 ay sonra sezon tekrar açılacağı için doluluğu Yaz Zirvesine (%90+) sabitle
        finalPrediction = Math.max(linearPrediction, 92.5); 
    } else {
        // Trend yukarıysa zaten iyiyiz
        finalPrediction = Math.max(linearPrediction, currentOccupancy + 10);
    }

    finalPrediction = Math.min(100, Math.max(0, finalPrediction));

    const diff = finalPrediction - currentOccupancy;
    const recommendedScenario = Math.round(diff);

    setOccScenario(recommendedScenario);
    setIsAiActive(true);
    
    const confidenceLevel = result.r2 > 0.4 ? "Yüksek" : "Orta (Mevsimsel Tahmin)";

    setAiPrediction({
      nextVal: finalPrediction.toFixed(1),
      change: recommendedScenario,
      confidence: confidenceLevel,
      horizon: "Gelecek Sezon (Yaz)"
    });

    setTimeout(() => setIsAiActive(false), 4000);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Hilton_KDS_${simMode}_Raporu.pdf`);
    } catch (err) {
      console.error("PDF Hatası:", err);
    }
  };

  const isLoading = rawKdsData.length === 0 && chartData.length === 0;
  const safeKdsData = rawKdsData.length > 0 ? rawKdsData : [{ name: "...", mevcut: 0, baseOneri: 0, overtime: 0, turnover: 0, z:0, risk:"-" }];

  // --- SİMÜLASYON 1: İŞE ALIM & KALİTE ---
  // --- SİMÜLASYONLAR (Hizmet Kalitesi Hesabı Eklenmiş Hali) ---
  const recruitmentSim = useMemo(() => {
    let totalMevcut = 0;
    const depts = safeKdsData.map(dept => {
      const occFactor = 1 + (occScenario / 100);
      const prodFactor = prodTarget / 100;
      const newOneri = Math.ceil((dept.baseOneri * occFactor) / prodFactor);
      const gap = newOneri - dept.mevcut;
      totalMevcut += dept.mevcut;
      return { ...dept, onerilen: newOneri, gap: gap, totalBudget: newOneri * avgCost };
    });
    
    const totalGap = depts.reduce((acc, curr) => acc + curr.gap, 0);
    const gapValue = Math.abs(totalGap);
    const estCost = gapValue * avgCost;
    const isHiring = totalGap >= 0;

    // --- EKSİK OLAN KISIM BURASIYDI ---
    const workloadStress = isHiring ? (gapValue / (totalMevcut || 1)) * 100 : 0;
    const serviceQualityScore = Math.max(0, 100 - (workloadStress * 2.5)); 
    
    let qualityColor = THEME.colors.success;
    let qualityText = "Mükemmel";
    if (serviceQualityScore < 85) { qualityColor = THEME.colors.warning; qualityText = "Riskli"; }
    if (serviceQualityScore < 70) { qualityColor = THEME.colors.danger; qualityText = "Kritik Düşüş"; }
    // ----------------------------------

    return { depts, gapValue, isHiring, quality: serviceQualityScore, qualityColor, qualityText, totalMevcut };
  }, [occScenario, prodTarget, safeKdsData, avgCost]);

  const totalGap = recruitmentSim.depts.reduce((acc, curr) => acc + curr.gap, 0);
  const isHiring = totalGap >= 0;
  const gapValue = Math.abs(totalGap);
  const estCost = gapValue * avgCost;

  const workloadStress = isHiring ? (gapValue / recruitmentSim.totalMevcut) * 100 : 0;
  const serviceQualityScore = Math.max(0, 100 - (workloadStress * 2.5)); 
  
  let qualityColor = THEME.colors.success;
  let qualityText = "Mükemmel";
  if (serviceQualityScore < 85) { qualityColor = THEME.colors.warning; qualityText = "Riskli"; }
  if (serviceQualityScore < 70) { qualityColor = THEME.colors.danger; qualityText = "Kritik Düşüş"; }



  // --- SİMÜLASYON 2: MALİYET VE ESNEKLİK ---
  const costSim = useMemo(() => {
    let totalBaseCost = 0, totalIdleCost = 0, totalOvertimeCost = 0, totalSaved = 0;
    const details = safeKdsData.map(dept => {
      const occFactor = 1 + (occScenario / 100);
      const needed = Math.ceil(dept.baseOneri * occFactor);
      const current = dept.mevcut;
      const gap = needed - current;
      const hourlyRate = avgCost / 160;
      let status = "";
      
      if (gap < 0) { 
        const idleCount = Math.abs(gap);
        const savedCount = idleCount * (flexibleRatio / 100); 
        const realIdleCount = idleCount - savedCount;
        const idleCost = realIdleCount * avgCost;
        const savedCost = savedCount * avgCost;
        const baseCost = (current - idleCount) * avgCost;
        totalBaseCost += baseCost; totalIdleCost += idleCost; totalSaved += savedCost;
        status = "Atıl";
      } else if (gap > 0) { 
        const totalMissingHours = gap * 160;
        const partTimeHours = totalMissingHours * (flexibleRatio / 100);
        const partTimeCost = partTimeHours * hourlyRate;
        const overtimeHours = totalMissingHours - partTimeHours;
        const overtimeCost = overtimeHours * hourlyRate * overtimeMultiplier;
        const costWithoutFlex = totalMissingHours * hourlyRate * overtimeMultiplier;
        const actualCost = partTimeCost + overtimeCost;
        totalSaved += (costWithoutFlex - actualCost);
        totalBaseCost += (current * avgCost) + partTimeCost;
        totalOvertimeCost += overtimeCost;
        status = "Mesai";
      } else {
        totalBaseCost += current * avgCost; status = "OK";
      }
      return { ...dept, needed, gap, status };
    });
    const chartData = [
      { name: 'Verimli', value: totalBaseCost, unit:'₺' },
      { name: 'Atıl (İsraf)', value: totalIdleCost, unit:'₺' },
      { name: 'Ekstra Mesai', value: totalOvertimeCost, unit:'₺' },
    ];
    
    // DÜZELTME BURADA: 'saved' değişkenini döndürüyoruz, artık undefined olmayacak.
    return { details, chartData, saved: totalSaved };
  }, [occScenario, flexibleRatio, overtimeMultiplier, safeKdsData, avgCost]);

  const overtimeData = safeKdsData;
  const riskMatrixData = safeKdsData.map(d => ({
    name: d.name, x: d.overtime, y: d.turnover, z: d.z || 10, risk: d.risk,
    fill: d.risk === 'KRİTİK' ? THEME.colors.danger : d.risk === 'YÜKSEK' ? THEME.colors.warning : THEME.colors.success
  }));

  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} vertical={false} opacity={0.4} />;
  const commonXAxis = <XAxis dataKey="name" stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textSub, fontSize: 10, fontWeight:500 }} tickLine={false} axisLine={false} dy={5} tickFormatter={translateDate} interval="preserveStartEnd" />;
  const commonYAxis = <YAxis stroke={THEME.colors.textSub} tick={{ fill: THEME.colors.textSub, fontSize: 10, fontWeight:500 }} tickLine={false} axisLine={false} />;

  const chartGradients = (
    <defs>
      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.danger} stopOpacity={0.8}/><stop offset="95%" stopColor={THEME.colors.danger} stopOpacity={0.1}/></linearGradient>
      <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={THEME.colors.success} stopOpacity={0.8}/><stop offset="95%" stopColor={THEME.colors.success} stopOpacity={0.1}/></linearGradient>
      <linearGradient id="barPrimary" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={THEME.colors.primary} stopOpacity={1}/><stop offset="100%" stopColor="#60a5fa" stopOpacity={1}/></linearGradient>
      <linearGradient id="barDanger" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={THEME.colors.danger} stopOpacity={1}/><stop offset="100%" stopColor="#f87171" stopOpacity={1}/></linearGradient>
    </defs>
  );

  const getBtnStyle = (period) => ({
    padding: "2px 8px", fontSize: "10px", fontWeight: "600", borderRadius: "4px", cursor: "pointer", border: "none",
    transition: "all 0.2s", backgroundColor: selectedPeriod === period ? THEME.colors.primary : "rgba(255,255,255,0.05)",
    color: selectedPeriod === period ? "#fff" : THEME.colors.textSub, marginLeft: "2px"
  });

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center", color: THEME.colors.textSub }}>⏳ Veriler Yükleniyor...</div>;

  return (
    <div style={{display:'grid', gridTemplateColumns: "2.8fr 1.2fr", gap:'12px', marginTop:'12px', fontFamily: "'Inter', sans-serif", height: "calc(100vh - 160px)", minHeight: "500px"}}>
      <style>{sliderStyles}</style>
      
      {/* SOL TARAF: GRAFİKLER */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "12px", height: "100%" }}>
        {/* 1. GELİR */}
        <div style={THEME.cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems:"center" }}>
            <div><h3 style={THEME.titleStyle}>Kâr & Doluluk</h3></div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "2px", borderRadius: "6px" }}>
              <button onClick={() => onPeriodChange(6)} style={getBtnStyle(6)}>6 Ay</button>
              <button onClick={() => onPeriodChange(12)} style={getBtnStyle(12)}>12 Ay</button>
              <button onClick={() => onPeriodChange(18)} style={getBtnStyle(18)}>18 Ay</button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                {chartGradients}{commonGrid}{commonXAxis}
                <YAxis yAxisId="left" stroke={THEME.colors.textSub} tickFormatter={(val)=>`₺${val/1000}k`} tickLine={false} axisLine={false} fontSize={10} width={40}/>
                <YAxis yAxisId="right" orientation="right" stroke={THEME.colors.textSub} tickLine={false} axisLine={false} unit="%" fontSize={10} width={30}/>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "10px", bottom: 0 }} iconSize={8} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Kâr" stroke={THEME.colors.danger} strokeWidth={2} dot={false} fill="url(#colorRevenue)" />
                <Line yAxisId="right" type="monotone" dataKey="occupancy" name="Doluluk" stroke={THEME.colors.success} strokeWidth={2} dot={false} fill="url(#colorOccupancy)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. VERİMLİLİK */}
        <div style={THEME.cardStyle}>
          <div style={{ marginBottom: "6px" }}><h3 style={THEME.titleStyle}>Verimlilik Trendi</h3></div>
          <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                {commonGrid}{commonXAxis}{commonYAxis}
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={12000} stroke={THEME.colors.warning} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="productivity" name="Verimlilik" stroke={THEME.colors.warning} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. OVERTIME */}
        <div style={THEME.cardStyle}>
          <div style={{ marginBottom: "6px" }}><h3 style={THEME.titleStyle}>Mevcut İş Yükü (Overtime)</h3></div>
          <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overtimeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                {chartGradients}{commonGrid}{commonYAxis}
                <XAxis dataKey="name" stroke={THEME.colors.textSub} tick={{ fontSize: 9 }} tickFormatter={(val)=> val.substring(0,8)} interval={0} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={180} stroke={THEME.colors.danger} strokeDasharray="3 3" />
                <Bar dataKey="normal" stackId="a" fill="url(#barPrimary)" barSize={20} />
                <Bar dataKey="overtime" stackId="a" fill="url(#barDanger)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. RİSK MATRİSİ */}
        <div style={THEME.cardStyle}>
          <div style={{ marginBottom: "6px" }}><h3 style={THEME.titleStyle}>Personel Risk Matrisi</h3></div>
          <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={THEME.colors.border} opacity={0.4} />
                <XAxis type="number" dataKey="x" stroke={THEME.colors.textSub} tick={{fontSize:10}} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="y" stroke={THEME.colors.textSub} tick={{fontSize:10}} tickLine={false} axisLine={false} />
                <ZAxis type="number" dataKey="z" range={[50, 300]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={30} stroke={THEME.colors.textSub} strokeDasharray="3 3" />
                <ReferenceLine y={10} stroke={THEME.colors.textSub} strokeDasharray="3 3" />
                <Scatter data={riskMatrixData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: SİMÜLASYON PANELI */}
      <div style={{...THEME.cardStyle, border: `1px solid ${simMode === 'recruitment' ? THEME.colors.danger : THEME.colors.warning}30`, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
         
         <div style={{ display:'flex', gap:'8px', marginBottom:'12px', borderBottom:`1px solid ${THEME.colors.border}`, paddingBottom:'8px' }}>
             <button onClick={()=>setSimMode('recruitment')} style={{flex:1, padding:'6px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', cursor:'pointer', border:'none', background: simMode === 'recruitment' ? `${THEME.colors.danger}20` : 'transparent', color: simMode === 'recruitment' ? THEME.colors.danger : THEME.colors.textSub}}>👥 İşe Alım</button>
             <button onClick={()=>setSimMode('cost')} style={{flex:1, padding:'6px', borderRadius:'6px', fontSize:'11px', fontWeight:'700', cursor:'pointer', border:'none', background: simMode === 'cost' ? `${THEME.colors.warning}20` : 'transparent', color: simMode === 'cost' ? THEME.colors.warning : THEME.colors.textSub}}>⚡ Maliyet</button>
         </div>

         <div style={{ display: "flex", flexDirection:'column', gap:'8px', marginBottom: "12px", borderBottom:`1px solid ${THEME.colors.border}`, paddingBottom:'12px' }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <h3 style={{...THEME.titleStyle, color: simMode === 'recruitment' ? THEME.colors.danger : THEME.colors.warning, margin:0, fontSize:'14px'}}>
                   {simMode === 'recruitment' ? 'Kadro & Kalite' : 'Kapasite Analizi'}
                </h3>
                <div style={{display:'flex', gap:'6px'}}>
                   <button onClick={handleAiPredict} style={{padding:'4px 10px', borderRadius:'6px', background: `linear-gradient(135deg, ${THEME.colors.purple}, ${THEME.colors.ai})`, color: '#fff', fontSize:'10px', border:'none', cursor:'pointer', fontWeight:'bold', boxShadow: '0 0 10px rgba(217, 70, 239, 0.4)'}}>🤖 AI</button>
                   <button onClick={handleDownloadPDF} style={{padding:'4px 8px', borderRadius:'6px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize:'10px', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontWeight:'bold'}}>🖨️ PDF</button>
                </div>
            </div>
            {aiPrediction && (
               <div style={{marginTop:'4px', padding:'8px', background: `${THEME.colors.ai}15`, borderRadius:'6px', borderLeft:`3px solid ${THEME.colors.ai}`, fontSize:'10px', color: THEME.colors.textMain, display: 'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span>🤖 <strong>{aiPrediction.horizon}</strong> tahmini: <strong>%{aiPrediction.nextVal}</strong>.</span>
                  <span style={{opacity:0.7, fontSize:'9px'}}>Güven: {aiPrediction.confidence}</span>
               </div>
            )}
         </div>

         {/* SİMÜLASYON İÇERİĞİ: İŞE ALIM & KALİTE */}
         {simMode === 'recruitment' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'10px', background: `${THEME.colors.bgDark}80`, borderRadius:'8px', marginBottom:'12px' }}>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                     <label style={{fontSize:'10px', color: THEME.colors.textMain}}>Doluluk Artışı</label>
                     <span style={{fontSize:'11px', color: isAiActive ? THEME.colors.ai : (occScenario > 0 ? THEME.colors.danger : THEME.colors.success), fontWeight:'700'}}>{occScenario > 0 ? `+${occScenario}%` : `${occScenario}%`} {isAiActive && '✨'}</span>
                  </div>
                  <input type="range" min="-20" max="100" step="1" value={occScenario} onChange={(e) => setOccScenario(Number(e.target.value))} className={`kds-range-input ${isAiActive ? 'thumb-ai' : 'thumb-danger'}`} />
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><label style={{fontSize:'10px', color: THEME.colors.textMain}}>Verimlilik</label><span style={{fontSize:'11px', color: THEME.colors.primary}}>%{prodTarget}</span></div>
                  <input type="range" min="80" max="120" step="5" value={prodTarget} onChange={(e) => setProdTarget(Number(e.target.value))} className="kds-range-input thumb-primary" />
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><label style={{fontSize:'10px', color: THEME.colors.textMain}}>Maliyet</label><span style={{fontSize:'11px', color: THEME.colors.success}}>₺{avgCost.toLocaleString()}</span></div>
                  <input type="range" min="20000" max="60000" step="1000" value={avgCost} onChange={(e) => setAvgCost(Number(e.target.value))} className="kds-range-input thumb-success" />
                </div>
              </div>

              {/* YENİ: HİZMET KALİTESİ BAROMETRESİ */}
              <div style={{padding:'0 4px', marginBottom:'10px'}}>
                 <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px', fontSize:'10px'}}>
                    <span style={{color:THEME.colors.textSub}}>Tahmini Hizmet Kalitesi</span>
                    <span style={{color:qualityColor, fontWeight:'bold'}}>{serviceQualityScore.toFixed(0)}/100 ({qualityText})</span>
                 </div>
                 <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{width:`${serviceQualityScore}%`, height:'100%', background: qualityColor, transition:'all 0.5s'}}></div>
                 </div>
              </div>

              <div style={{ flexShrink: 0, height: "160px", width: "100%", display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px', position:'relative' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={recruitmentSim.depts} dataKey="totalBudget" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2}>
                        {recruitmentSim.depts.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={THEME.colors.cardBg} strokeWidth={2} />)}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div style={{position:'absolute', textAlign:'center', pointerEvents:'none'}}>
                    <div style={{fontSize:'9px', color:THEME.colors.textSub}}>Bütçe</div>
                 </div>
              </div>
              <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", borderTop:`1px solid ${THEME.colors.border}`, paddingTop:'8px' }}>
                 <table style={{width:'100%', borderCollapse:'collapse', fontSize:'11px', color:THEME.colors.textMain}}>
                    <thead><tr style={{textAlign:'left', color:THEME.colors.textSub}}><th style={{padding:'4px'}}>Dept</th><th style={{padding:'4px', textAlign:'center'}}>Mevcut</th><th style={{padding:'4px', textAlign:'center'}}>Öneri</th><th style={{padding:'4px', textAlign:'right'}}>Fark</th></tr></thead>
                    <tbody>
                       {recruitmentSim.depts.map((dept, i) => {
                          const isPositive = dept.gap > 0;
                          return (<tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`}}><td style={{padding:'6px 4px', fontWeight:'600'}}>{dept.name}</td><td style={{padding:'6px 4px', textAlign:'center', color:THEME.colors.textSub}}>{dept.mevcut}</td><td style={{padding:'6px 4px', textAlign:'center', fontWeight:'bold'}}>{dept.onerilen}</td><td style={{padding:'6px 4px', textAlign:'right'}}><span style={{color: isPositive ? THEME.colors.danger : THEME.colors.success, fontWeight:'700'}}>{isPositive ? '+' : ''}{dept.gap}</span></td></tr>)
                       })}
                    </tbody>
                 </table>
              </div>
            </>
         )}

         {/* SİMÜLASYON İÇERİĞİ: MALİYET */}
         {simMode === 'cost' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px', padding:'10px', background: `${THEME.colors.bgDark}80`, borderRadius:'8px', marginBottom:'12px' }}>
                 <div>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><label style={{fontSize:'10px', color: THEME.colors.textMain}}>Doluluk Senaryosu</label><span style={{fontSize:'11px', color: isAiActive ? THEME.colors.ai : THEME.colors.primary}}>{occScenario}% {isAiActive && '✨'}</span></div>
                   <input type="range" min="-50" max="100" step="1" value={occScenario} onChange={(e) => setOccScenario(Number(e.target.value))} className={`kds-range-input ${isAiActive ? 'thumb-ai' : 'thumb-primary'}`} />
                 </div>
                 <div>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><label style={{fontSize:'10px', color: THEME.colors.textMain}}>Esnek İşgücü Oranı</label><span style={{fontSize:'11px', color: THEME.colors.warning}}>{flexibleRatio}%</span></div>
                   <input type="range" min="0" max="50" step="5" value={flexibleRatio} onChange={(e) => setFlexibleRatio(Number(e.target.value))} className="kds-range-input thumb-warning" />
                 </div>
                 <div>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}><label style={{fontSize:'10px', color: THEME.colors.textMain}}>Mesai Çarpanı</label><span style={{fontSize:'11px', color: THEME.colors.danger}}>{overtimeMultiplier}x</span></div>
                   <input type="range" min="1.0" max="3.0" step="0.5" value={overtimeMultiplier} onChange={(e) => setOvertimeMultiplier(Number(e.target.value))} className="kds-range-input thumb-danger" />
                 </div>
              </div>
              <div style={{ flexShrink: 0, height: "180px", width: "100%", display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'10px', position:'relative' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={costSim.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3}>
                        {costSim.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COST_COLORS[index]} stroke={THEME.colors.cardBg} strokeWidth={2} />)}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                     <Legend wrapperStyle={{fontSize:'10px', bottom:0}} iconSize={8} />
                   </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", borderTop:`1px solid ${THEME.colors.border}`, paddingTop:'8px' }}>
                 <table style={{width:'100%', borderCollapse:'collapse', fontSize:'10px', color:THEME.colors.textMain}}>
                    <thead><tr style={{textAlign:'left', color:THEME.colors.textSub}}><th style={{padding:'4px'}}>Dept</th><th style={{padding:'4px', textAlign:'center'}}>Gereken</th><th style={{padding:'4px', textAlign:'right'}}>Durum</th></tr></thead>
                    <tbody>
                       {costSim.details.map((dept, i) => {
                          const color = dept.gap < 0 ? THEME.colors.idle : dept.gap > 0 ? THEME.colors.overtime : THEME.colors.success;
                          return (<tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.03)`}}><td style={{padding:'6px 4px', fontWeight:'600'}}>{dept.name}</td><td style={{padding:'6px 4px', textAlign:'center'}}>{dept.needed}</td><td style={{padding:'6px 4px', textAlign:'right'}}><span style={{color: color, fontWeight:'700'}}>{dept.status === "Atıl" ? `${dept.gap} (Atıl)` : dept.status === "Mesai" ? `+${dept.gap} (Mesai)` : 'OK'}</span></td></tr>)
                       })}
                    </tbody>
                 </table>
              </div>
            </>
         )}

         {/* ORTAK ALT ÖZET */}
         <div style={{marginTop: 10, padding: "10px", background: simMode==='recruitment' ? `${THEME.colors.danger}15` : `${THEME.colors.warning}15`, borderRadius: "6px", borderLeft: `3px solid ${simMode==='recruitment' ? THEME.colors.danger : THEME.colors.warning}`, fontSize: 11, color: THEME.colors.textMain, flexShrink:0}}>
             {simMode === 'recruitment' ? (
                <><strong>Sonuç:</strong> {gapValue} kişi {isHiring ? 'alım' : 'çıkarım'}. <strong>Hizmet Kalitesi:</strong> <span style={{color:qualityColor}}>{qualityText}</span></>
             ) : (
                <><strong>Verimlilik:</strong> Esnek işgücü sayesinde <strong>₺{costSim.saved.toLocaleString()}</strong> maliyet kurtarıldı.</>
             )}
         </div>
      </div>

      {/* --- PROFESYONEL RAPOR TASARIMI (GİZLİ ALAN) --- */}
      <div style={{position:'absolute', left:'-9999px', top:0, width:'794px', background:'#fff', color:'#000', padding:'40px', fontFamily:'Arial, sans-serif'}} ref={reportRef}>
        
        {/* RAPOR BAŞLIK */}
        <div style={{borderBottom:'3px solid #3b82f6', paddingBottom:'20px', marginBottom:'30px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <div>
             <h1 style={{margin:0, fontSize:'28px', color:'#1e293b', textTransform:'uppercase', letterSpacing:'1px'}}>Yönetici Karar Raporu</h1>
             <p style={{margin:'5px 0 0', color:'#64748b', fontSize:'14px', fontWeight:'500'}}>Hilton İzmir - Stratejik Planlama & KDS</p>
           </div>
           <div style={{textAlign:'right'}}>
             <div style={{fontSize:'12px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px'}}>Rapor Tarihi</div>
             <div style={{fontWeight:'700', fontSize:'16px', color:'#1e293b'}}>{new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
           </div>
        </div>

        {/* YÖNETİCİ ÖZETİ */}
        <div style={{background:'#f8fafc', padding:'25px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'30px'}}>
            <h3 style={{margin:'0 0 15px 0', fontSize:'16px', color:'#0f172a', textTransform:'uppercase', borderBottom:'1px solid #cbd5e1', paddingBottom:'8px'}}>Yönetici Özeti: {simMode === 'recruitment' ? 'İşe Alım & Kalite' : 'Maliyet & Verimlilik'}</h3>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'14px', color:'#334155'}}>
                {simMode === 'recruitment' ? (
                    <>
                        <div>
                            <strong>Simülasyon Parametreleri:</strong><br/>
                            • Doluluk Artışı Beklentisi: <span style={{color: occScenario > 0 ? '#10b981' : '#ef4444'}}>%{occScenario}</span><br/>
                            • Verimlilik Hedefi: %{prodTarget}<br/>
                            • Ortalama Personel Maliyeti: ₺{avgCost.toLocaleString()}
                        </div>
                        <div style={{textAlign:'right'}}>
                            <strong>Analiz Sonucu:</strong><br/>
                            • Toplam İşgücü Açığı: <strong>{recruitmentSim.gapValue} Kişi</strong><br/>
                            • Öngörülen Hizmet Kalitesi: <strong style={{color: recruitmentSim.quality >= 85 ? '#10b981' : '#ef4444'}}>{recruitmentSim.qualityText} (%{recruitmentSim.quality.toFixed(0)})</strong>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <strong>Simülasyon Parametreleri:</strong><br/>
                            • Esnek İşgücü Oranı: %{flexibleRatio}<br/>
                            • Mesai Maliyet Çarpanı: {overtimeMultiplier}x
                        </div>
                        <div style={{textAlign:'right'}}>
                            <strong>Finansal Etki:</strong><br/>
                            • Kurtarılan Maliyet (Verimlilik): <strong>₺{costSim.saved.toLocaleString()}</strong><br/>
                            • Durum: <strong>{costSim.saved > 0 ? 'Pozitif Etki' : 'Nötr/Negatif'}</strong>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* DETAYLI TABLO */}
        <h3 style={{margin:'0 0 15px 0', fontSize:'16px', color:'#0f172a', textTransform:'uppercase'}}>Departman Bazlı Detaylı Analiz</h3>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px', border:'1px solid #e2e8f0'}}>
            <thead style={{background:'#1e293b', color:'#fff'}}>
                <tr>
                    <th style={{padding:'12px', textAlign:'left'}}>DEPARTMAN</th>
                    <th style={{padding:'12px', textAlign:'center'}}>MEVCUT KADRO</th>
                    <th style={{padding:'12px', textAlign:'center'}}>{simMode === 'recruitment' ? 'ÖNERİLEN KADRO' : 'GEREKEN KADRO'}</th>
                    <th style={{padding:'12px', textAlign:'center'}}>{simMode === 'recruitment' ? 'FARK' : 'DURUM'}</th>
                    <th style={{padding:'12px', textAlign:'right'}}>FİNANSAL ETKİ (Tahmini)</th>
                </tr>
            </thead>
            <tbody>
                {simMode === 'recruitment' ? (
                    recruitmentSim.depts.map((dept, i) => (
                        <tr key={i} style={{borderBottom:'1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc'}}>
                            <td style={{padding:'10px', fontWeight:'600', color:'#334155'}}>{dept.name}</td>
                            <td style={{padding:'10px', textAlign:'center', color:'#64748b'}}>{dept.mevcut}</td>
                            <td style={{padding:'10px', textAlign:'center', fontWeight:'bold', color:'#0f172a'}}>{dept.onerilen}</td>
                            <td style={{padding:'10px', textAlign:'center', fontWeight:'bold', color: dept.gap > 0 ? '#ef4444' : '#10b981'}}>
                                {dept.gap > 0 ? `+${dept.gap} (Alım)` : dept.gap < 0 ? `${dept.gap} (Fazla)` : '-'}
                            </td>
                            <td style={{padding:'10px', textAlign:'right', color:'#334155'}}>
                                ₺{(dept.onerilen * avgCost).toLocaleString()}
                            </td>
                        </tr>
                    ))
                ) : (
                    costSim.details.map((dept, i) => (
                        <tr key={i} style={{borderBottom:'1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc'}}>
                            <td style={{padding:'10px', fontWeight:'600', color:'#334155'}}>{dept.name}</td>
                            <td style={{padding:'10px', textAlign:'center', color:'#64748b'}}>{dept.mevcut}</td>
                            <td style={{padding:'10px', textAlign:'center', fontWeight:'bold', color:'#0f172a'}}>{dept.needed}</td>
                            <td style={{padding:'10px', textAlign:'center', fontWeight:'bold', color: dept.status === 'Atıl' ? '#64748b' : dept.status === 'Mesai' ? '#f97316' : '#10b981'}}>
                                {dept.status}
                            </td>
                            <td style={{padding:'10px', textAlign:'right', color:'#334155'}}>
                                {dept.gap > 0 ? `Mesai Riski` : dept.gap < 0 ? `Atıl Kapasite` : 'Optimize'}
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>

        {/* FOOTER */}
        <div style={{marginTop:'50px', borderTop:'1px solid #e2e8f0', paddingTop:'15px', display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#94a3b8'}}>
            <div>
                Bu rapor Hilton KDS sistemi tarafından otomatik oluşturulmuştur.<br/>
                Veriler anlık sistem kayıtlarına dayanmaktadır.
            </div>
            <div style={{textAlign:'right'}}>
                Sayfa 1 / 1
            </div>
        </div>
      </div>
    </div>
  );
}