"use client";

import { useEffect } from "react";

const checkoutUrl = "/biblioteca?livro=livro-da-sabedoria-volume-1&formato=PDF";

export function RedirectToLibrary() {
  useEffect(() => {
    window.location.replace(checkoutUrl);
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#081321", color: "#f5f0e8", fontFamily: "Arial, sans-serif" }}>
      <p>Abrindo o livro… <a href={checkoutUrl} style={{ color: "#edbd49" }}>Continuar para a prévia e compra</a></p>
    </main>
  );
}
