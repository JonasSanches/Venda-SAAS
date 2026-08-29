"use client";

import { useEffect } from "react";
import { BrandName } from "./brand-name";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const key = "vendamais-recovered-version";
    if (sessionStorage.getItem(key) !== "1") {
      sessionStorage.setItem(key, "1");
      window.location.reload();
    }
  }, []);

  return (
    <html lang="pt-BR">
      <body>
        <main className="recovery-page">
          <div className="brand dark"><span>V</span> <BrandName /></div>
          <h1>Vamos recarregar o sistema</h1>
          <p>O navegador encontrou uma versão antiga dos arquivos. Tente novamente para abrir a versão atual.</p>
          <button onClick={() => { sessionStorage.removeItem("vendamais-recovered-version"); reset(); window.location.reload(); }}>Recarregar agora</button>
        </main>
      </body>
    </html>
  );
}
