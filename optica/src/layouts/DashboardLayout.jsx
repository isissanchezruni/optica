// src/layouts/DashboardLayout.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Layout.css"; // opcional: tus estilos

export default function DashboardLayout() {
  const { profile } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar fija - le pasamos role */}
      <Sidebar role={profile?.role} />

      {/* Contenido */}
      <main style={{ flex: 1, padding: "32px", background: "#f6f8fc" }}>
        <Outlet />
      </main>
    </div>
  );
}
