import React, { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard"; 
import Login from "./pages/Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sayfa ilk açıldığında hafızayı kontrol et
  useEffect(() => {
    const userLoggedIn = localStorage.getItem("hilton_auth") === "true";
    setIsLoggedIn(userLoggedIn);
  }, []);

  // GİRİŞ YAPMA FONKSİYONU
  const handleLogin = (status) => {
    setIsLoggedIn(true);
    localStorage.setItem("hilton_auth", "true");
  };

  // ÇIKIŞ YAPMA FONKSİYONU (Bunu ekliyoruz)
  const handleLogout = () => {
    setIsLoggedIn(false); // Anında Login ekranına atar
    localStorage.removeItem("hilton_auth"); // Hafızayı temizler
  };

  return (
    <div>
      {isLoggedIn ? (
        // Dashboard'a "onLogout" adında bir yetki (fonksiyon) gönderiyoruz
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;