import React, { useState } from "react";
import hiltonLogo from './hilton.png'; // Logoyu buradan çekiyoruz

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // BASİT DOĞRULAMA SİMÜLASYONU
    // Gerçek projede burası Backend API'ye gider.
    setTimeout(() => {
      if (email === "admin" && password === "1234") {
        onLogin(true); // Başarılı giriş
      } else {
        setError("Kullanıcı adı veya şifre hatalı!");
        setLoading(false);
      }
    }, 800); // 0.8 saniye bekleme efekti
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      // Ana temadaki arka planın aynısı
      background: `
        radial-gradient(circle at 100% 0%, rgba(220, 38, 38, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        #0f172a
      `,
      backgroundSize: "cover",
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* CAM KART (GLASS CARD) */}
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "40px",
        borderRadius: "24px",
        background: "rgba(30, 41, 59, 0.6)", // Yarı saydam
        backdropFilter: "blur(20px)",         // Buzlu cam efekti
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        textAlign: "center"
      }}>
        
        {/* LOGO ALANI */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={hiltonLogo} 
            alt="Hilton Logo" 
            style={{ 
              width: "140px", 
              height: "auto",
              // filter: "brightness(0) invert(1)" // Eğer logo siyahsa beyaz yapmak için açabilirsin
            }} 
          />
        </div>

        <h2 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: "24px", fontWeight: "700" }}>
          Yönetici Girişi
        </h2>
        <p style={{ color: "#94a3b8", margin: "0 0 32px 0", fontSize: "14px" }}>
          Personel Karar Destek Sistemi
        </p>

        <form onSubmit={handleSubmit}>
          {/* EMAIL INPUT */}
          <div style={{ marginBottom: "16px", textAlign: "left" }}>
            <label style={{ display: "block", color: "#e2e8f0", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              Kullanıcı Adı
            </label>
            <input
              type="text"
              placeholder="admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#fff",
                outline: "none",
                fontSize: "14px",
                transition: "border 0.2s",
                boxSizing: "border-box" // Input taşmasını önler
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#334155"}
            />
          </div>

          {/* PASSWORD INPUT */}
          <div style={{ marginBottom: "24px", textAlign: "left" }}>
            <label style={{ display: "block", color: "#e2e8f0", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              Şifre
            </label>
            <input
              type="password"
              placeholder="••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#fff",
                outline: "none",
                fontSize: "14px",
                transition: "border 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#334155"}
            />
          </div>

          {/* HATA MESAJI */}
          {error && (
            <div style={{ 
              marginBottom: "16px", 
              padding: "10px", 
              borderRadius: "8px", 
              background: "rgba(239, 68, 68, 0.1)", 
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#ef4444", 
              fontSize: "13px" 
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* GİRİŞ BUTONU */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: loading ? "#64748b" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "wait" : "pointer",
              transition: "transform 0.1s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
            onMouseDown={(e) => !loading && (e.target.style.transform = "scale(0.98)")}
            onMouseUp={(e) => !loading && (e.target.style.transform = "scale(1)")}
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={{ marginTop: "24px", fontSize: "12px", color: "#64748b" }}>
          © 2025 Hilton Hotels & Resorts. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
}