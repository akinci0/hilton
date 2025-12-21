import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // DİKKAT: Dashboard değil App import ediliyor
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App /> {/* DİKKAT: Burası Dashboard DEĞİL, App olmalı */}
  </React.StrictMode>
);