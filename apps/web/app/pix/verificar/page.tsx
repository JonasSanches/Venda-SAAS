"use client";

import { FormEvent, useMemo, useState } from "react";
import "./pix-verifier.css";

type Tlv = { id: string; value: string };
type PixDetails = {
  merchantName: string;
  merchantCity?: string;
  amount?: string;
  transactionId?: string;
  pixKey?: string;
  checksumValid: boolean;
};

function parseTlv(payload: string, start = 0, end = payload.length): Tlv[] {
  const fields: Tlv[] = [];
  let position = start;
  while (position < end) {
    if (position + 4 > end) throw Error("O código Pix está incompleto.");
    const id = payload.slice(position, position + 2);
    const lengthText = payload.slice(position + 2, position + 4);
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lengthText)) throw Error("O código Pix não segue o formato esperado.");
    const length = Number(lengthText);
    const valueStart = position + 4;
    const valueEnd = valueStart + length;
    if (valueEnd > end) throw Error("O código Pix está incompleto.");
    fields.push({ id, value: payload.slice(valueStart, valueEnd) });
    position = valueEnd;
  }
  if (position !== end) throw Error("O código Pix não segue o formato esperado.");
  return fields;
}

function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function decodePix(code: string): PixDetails {
  const payload = code.replace(/\s+/g, "");
  if (!payload.startsWith("000201")) throw Error("Cole o código Pix “copia e cola” completo. Uma chave Pix isolada não pode ser consultada por esta tela.");
  const fields = parseTlv(payload);
  const crc = fields.find((field) => field.id === "63");
  if (!crc || crc.value.length !== 4 || !payload.endsWith(`6304${crc.value}`)) throw Error("Não foi possível localizar a validação do código Pix.");
  const checksumValid = crc16Ccitt(payload.slice(0, -4)) === crc.value.toUpperCase();
  if (!checksumValid) throw Error("Este código Pix parece ter sido alterado ou está inválido.");
  const merchantName = fields.find((field) => field.id === "59")?.value.trim();
  if (!merchantName) throw Error("O código não informa o nome do recebedor.");
  const additional = fields.find((field) => field.id === "62");
  const transactionId = additional ? parseTlv(additional.value).find((field) => field.id === "05")?.value.trim() : undefined;
  const account = fields.find((field) => Number(field.id) >= 26 && Number(field.id) <= 51 && (() => {
    try { return parseTlv(field.value).some((child) => child.id === "00" && child.value === "BR.GOV.BCB.PIX"); } catch { return false; }
  })());
  const accountFields = account ? parseTlv(account.value) : [];
  return {
    merchantName,
    merchantCity: fields.find((field) => field.id === "60")?.value.trim(),
    amount: fields.find((field) => field.id === "54")?.value.trim(),
    transactionId,
    pixKey: accountFields.find((field) => field.id === "01")?.value.trim(),
    checksumValid,
  };
}

function money(value?: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor definido no pagamento";
}

export default function PixVerifierPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<PixDetails | null>(null);
  const [error, setError] = useState("");
  const hasCode = useMemo(() => code.trim().length > 0, [code]);

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setResult(decodePix(code));
      setError("");
    } catch (cause) {
      setResult(null);
      setError((cause as Error).message);
    }
  }

  return <main className="pix-verifier-page">
    <header className="pix-verifier-header"><a href="/" aria-label="Ir para a página inicial do Venda+"><span>V</span><b>Venda<span>+</span></b></a><a href="/" className="pix-verifier-back">Voltar ao Venda+</a></header>
    <section className="pix-verifier-shell" aria-labelledby="pix-verifier-title">
      <div className="pix-verifier-copy"><small>VERIFICAÇÃO DE PIX</small><h1 id="pix-verifier-title">Confira quem aparece no código Pix antes de pagar.</h1><p>Cole o código “Pix copia e cola”. A leitura acontece neste dispositivo e não é salva pelo Venda+.</p><ul><li><b>Nome do recebedor</b><span>lido do campo oficial presente no código.</span></li><li><b>Validação de integridade</b><span>confere o checksum do padrão BR Code.</span></li><li><b>Sem login</b><span>acesso direto para conferência rápida.</span></li></ul></div>
      <form className="pix-verifier-form" onSubmit={verify}>
        <div className="pix-verifier-form-heading"><small>PIX COPIA E COLA</small><h2>Verificar código</h2><p>Use o código completo, começando normalmente por <code>000201</code>.</p></div>
        <label htmlFor="pix-code">Código Pix<input id="pix-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Cole aqui o código Pix" autoComplete="off" spellCheck={false} required /></label>
        <button disabled={!hasCode}>Ler código Pix</button>
        {error && <div className="pix-verifier-error" role="alert">{error}</div>}
        {result && <section className="pix-verifier-result" aria-live="polite"><header><span aria-hidden="true">✓</span><div><small>CÓDIGO ÍNTEGRO</small><h2>Dados encontrados</h2></div></header><dl><div><dt>Nome informado no Pix</dt><dd>{result.merchantName}</dd></div><div><dt>Cidade</dt><dd>{result.merchantCity || "Não informada"}</dd></div><div><dt>Valor</dt><dd>{money(result.amount)}</dd></div><div><dt>Identificador</dt><dd>{result.transactionId || "Não informado"}</dd></div></dl>{result.pixKey && <p className="pix-verifier-key"><b>Chave no payload:</b> {result.pixKey}</p>}<p className="pix-verifier-note">O nome é lido do próprio código Pix. Esta tela não confirma a titularidade bancária nem realiza pagamento.</p></section>}
        <p className="pix-verifier-legal">Para consultar o titular de uma chave Pix avulsa, o Venda+ precisará de integração com um PSP autorizado a consultar o DICT do Banco Central.</p>
      </form>
    </section>
  </main>;
}
