import React from "react";

export default function DistrictList({ items = [], activeId = null, onSelect }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!Array.isArray(items)) return <div className="errText">Veri yüklenemedi</div>;

  // RENK VE ETİKET AYARLAYICI
  const getBadgeStatus = (score) => {
    const s = Number(score);
    // EŞİKLERİ BURADAN AYARLIYORUZ
    if (s >= 4.7) return { label: "Mükemmel", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" }; // YEŞİL
    if (s >= 4.5) return { label: "İyi",      color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" }; // MAVİ
    if (s >= 4.0) return { label: "Orta",     color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" }; // TURUNCU
    return               { label: "Düşük",    color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)"  }; // KIRMIZI
  };

  return (
    <div className="listWrap">
      {safeItems.map((d, idx) => {
        const idNum = Number(d?.districtId);
        const isActive = Number(activeId) === idNum;

        const name = String(d?.name ?? "Unknown");
        const occ = Number(d?.occupancy ?? 0);
        const score = Number(d?.score ?? 0);

        // Score'a göre durumu al
        const status = getBadgeStatus(score);

        return (
          <button
            key={Number.isFinite(idNum) ? idNum : `row-${idx}`}
            className={`districtRow ${isActive ? "districtRowActive" : ""}`}
            onClick={() => {
              if (Number.isFinite(idNum)) onSelect?.(idNum);
            }}
            type="button"
          >
            <div className="districtTop">
              <div className="districtTitle">{name}</div>

              {/* DİNAMİK RENKLİ BADGE */}
              <div
                className="badge"
                style={{
                  backgroundColor: status.bg,
                  color: status.color,
                  border: `1px solid ${status.color}`,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600"
                }}
              >
                {status.label}
              </div>
            </div>

            <div className="districtMeta">
              <span>Doluluk: %{Number.isFinite(occ) ? occ.toFixed(0) : "0"}</span>
              <span style={{ fontWeight: "bold", color: status.color }}>
                 Puan: {Number.isFinite(score) ? score.toFixed(1) : "-"}/5
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}