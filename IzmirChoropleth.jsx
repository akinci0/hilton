import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet"; // TileLayer ekledik (İstersen uydu görüntüsü vb. için)
import "leaflet/dist/leaflet.css";

/* ---- HELPER: Türkçe Karakter Düzeltme ---- */
function normKey(s) {
  return String(s || "")
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* ---- İZİN VERİLEN İLÇELER ---- */
const ALLOWED = new Set([
  "konak",
  "gaziemir",
  "cesme",
  "bayrakli",
  "karsiyaka",
  "aliaga",
]);

/* ---- RENK PALETİ (Ters Mantık: Dolu = Koyu) ---- */
const COLORS = {
  selectedBorder: "#ffffff",
  critical: "#4c0519", // %85+ (En Koyu)
  high:     "#be123c", // %65-85
  medium:   "#f43f5e", // %40-65
  low:      "#fda4af", // %0-40 (En Açık)
  empty:    "rgba(255, 255, 255, 0.05)",
  disabled: "rgba(255, 255, 255, 0.02)",
  border:   "rgba(255,255,255,0.2)"
};

export default function IzmirChoropleth({
  districts = [],
  selectedDistrictId,
  onSelectDistrict,
}) {
  const [geojson, setGeojson] = useState(null);

  const occById = useMemo(() => {
    const m = new Map();
    districts.forEach((d) => m.set(Number(d.districtId), Number(d.occupancy || 0)));
    return m;
  }, [districts]);

  const idByName = useMemo(() => {
    const m = new Map();
    districts.forEach((d) => m.set(normKey(d.name), Number(d.districtId)));
    return m;
  }, [districts]);

  useEffect(() => {
    fetch("/geo/ilceler.geojson")
      .then((r) => r.json())
      .then(setGeojson)
      .catch(console.error);
  }, []);

  const getFillColor = (occupancy) => {
    if (occupancy >= 85) return COLORS.critical;
    if (occupancy >= 65) return COLORS.high;
    if (occupancy >= 40) return COLORS.medium;
    if (occupancy > 0)   return COLORS.low;
    return COLORS.empty;
  };

  const styleFeature = (feature) => {
    const name = feature.properties?.ilce_adi || feature.properties?.name;
    const key = normKey(name);
    const districtId = idByName.get(key);
    const occ = districtId ? occById.get(districtId) ?? 0 : 0;
    const isAllowed = ALLOWED.has(key);
    const isSelected = Number(districtId) === Number(selectedDistrictId);

    if (!isAllowed) {
      return {
        weight: 1,
        color: "rgba(255,255,255,0.05)",
        fillOpacity: 1,
        fillColor: COLORS.disabled,
      };
    }

    return {
      weight: isSelected ? 3 : 1,
      color: isSelected ? COLORS.selectedBorder : COLORS.border,
      fillOpacity: 1,
      fillColor: getFillColor(occ),
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties?.ilce_adi || feature.properties?.name;
    const key = normKey(name);
    const districtId = idByName.get(key);
    const occ = districtId ? occById.get(districtId) ?? 0 : 0;

    layer.bindTooltip(
      ALLOWED.has(key) ? `<div style="font-weight:bold">${name}</div><div>Doluluk: %${occ}</div>` : `${name}`,
      { sticky: true, direction: "top", className: "custom-leaflet-tooltip" }
    );

    if (districtId && ALLOWED.has(key)) {
      layer.on({
        click: () => onSelectDistrict?.(districtId),
        mouseover: (e) => e.target.setStyle({ weight: 2, color: "#fff" }),
        mouseout: (e) => {
          const isSelected = Number(districtId) === Number(selectedDistrictId);
          e.target.setStyle({ weight: isSelected ? 3 : 1, color: isSelected ? COLORS.selectedBorder : COLORS.border });
        }
      });
    }
  };

  return (
    <div
      style={{
        height: 420,
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255,255,255,0.1)",
        position: "relative" // Z-index yönetimi için
      }}
    >
      <MapContainer
        center={[38.42, 27.14]}
        zoom={9}
        style={{ height: "100%", width: "100%", background: "transparent" }}
        // --- HAREKET ÖZELLİKLERİ AÇILDI ---
        zoomControl={true}         // Zoom butonlarını (+/-) göster
        scrollWheelZoom={true}     // Mouse tekerleğiyle zoom yap
        doubleClickZoom={true}     // Çift tıklamayla zoom yap
        dragging={true}            // Sürüklemeyi aç
        attributionControl={false}
      >
        {/* İstersen arkaya gerçek bir harita katmanı koyabilirsin (Opsiyonel) */}
        {/* <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" /> */}

        {geojson && (
          <GeoJSON
            data={geojson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}