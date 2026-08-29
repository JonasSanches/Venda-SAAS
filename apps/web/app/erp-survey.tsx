"use client";

import { FormEvent, useEffect, useState } from "react";

type Lang = "pt" | "en";

const priorityOptions = ["Facilidade de uso", "Segurança das informações", "Relatórios e indicadores", "Automação de tarefas", "Integração entre setores", "Acesso pelo celular", "Suporte 24 horas", "Personalização", "Integração com outros sistemas"];
const dashboardOptions = ["Faturamento", "Vendas", "Contas a pagar e receber", "Estoque", "Fluxo de caixa", "Contratos", "Impostos e documentos fiscais", "Desempenho por funcionário", "Desempenho por filial"];

export function ErpSurvey() {
  const [lang, setLang] = useState<Lang>("pt");
  useEffect(() => {
    const sync = () => setLang(document.documentElement.lang === "en" ? "en" : "pt");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);
  const en = lang === "en";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines = [`*${en ? "ERP needs survey" : "Questionário de necessidades do ERP"}*`];
    const labels: Record<string, string> = {
      name: en ? "Name" : "Nome", company: en ? "Company" : "Empresa", contact: en ? "Contact" : "Contato",
      priority: en ? "Main priorities" : "Principais prioridades", problem: en ? "Main problem" : "Principal problema",
      manual: en ? "Manual controls" : "Controles manuais", users: en ? "Users" : "Usuários", branches: en ? "Branches" : "Filiais",
      dashboard: en ? "Dashboard information" : "Informações no painel", mobile: en ? "Mobile access" : "Acesso pelo celular",
      automation: en ? "Desired automations" : "Automações desejadas", support: en ? "Preferred support" : "Suporte preferido",
      reason: en ? "Reason to switch" : "Motivo para trocar", budget: en ? "Monthly budget" : "Valor mensal", essential: en ? "Essential feature" : "Função indispensável",
    };
    for (const [key, label] of Object.entries(labels)) {
      const values = data.getAll(key).map(String).filter(Boolean);
      if (values.length) lines.push(`\n*${label}:* ${values.join(", ")}`);
    }
    window.open(`https://wa.me/5511978436640?text=${encodeURIComponent(lines.join(""))}`, "_blank", "noopener,noreferrer");
  };
  return <section className="erp-survey" id="questionario">
    <div className="section-heading"><small>{en ? "HELP US UNDERSTAND YOUR BUSINESS" : "AJUDE-NOS A ENTENDER SEU NEGÓCIO"}</small><h2>{en ? "What would make an ERP truly useful to you?" : "O que tornaria um ERP realmente útil para você?"}</h2><p>{en ? "Answer in a few minutes. Your answers help our team understand your operation and recommend the most suitable structure." : "Responda em poucos minutos. Suas respostas ajudam nossa equipe a entender sua operação e indicar a estrutura mais adequada."}</p></div>
    <form onSubmit={submit}>
      <fieldset className="survey-contact"><legend>{en ? "About you" : "Sobre você"}</legend><label>{en ? "Name" : "Nome"}<input name="name" required /></label><label>{en ? "Company" : "Empresa"}<input name="company" required /></label><label>{en ? "WhatsApp or email" : "WhatsApp ou e-mail"}<input name="contact" required /></label></fieldset>
      <fieldset><legend>1. {en ? "Besides well-structured purchasing, inventory, contracts, sales, billing, tax, financial and invoice modules, what matters most in an ERP?" : "Além de módulos bem estruturados de compras, estoque, contratos, vendas, faturamento, fiscal, financeiro, NF-e, NFS-e e NFC-e, o que é mais importante em um ERP?"}</legend><div className="survey-checks">{priorityOptions.map(option => <label key={option}><input type="checkbox" name="priority" value={option} />{option}</label>)}</div><input name="priority" placeholder={en ? "Other priority" : "Outra prioridade"} /></fieldset>
      <fieldset><legend>2. {en ? "What is the main problem you expect to solve?" : "Qual é o principal problema que você espera resolver?"}</legend><textarea name="problem" required /></fieldset>
      <fieldset><legend>3. {en ? "Which tasks are still managed in spreadsheets, notebooks or separate systems?" : "Quais tarefas ainda são controladas por planilhas, cadernos ou sistemas separados?"}</legend><textarea name="manual" /></fieldset>
      <div className="survey-columns"><fieldset><legend>4. {en ? "How many people will use it?" : "Quantas pessoas utilizarão o sistema?"}</legend><select name="users" required><option value="">{en ? "Select" : "Selecione"}</option><option>1 a 5</option><option>6 a 15</option><option>16 a 50</option><option>{en ? "More than 50" : "Mais de 50"}</option></select></fieldset><fieldset><legend>5. {en ? "How many branches?" : "Quantas unidades ou filiais?"}</legend><input name="branches" type="number" min="1" required /></fieldset></div>
      <fieldset><legend>6. {en ? "What would you like to see on the home dashboard?" : "Quais informações gostaria de acompanhar na tela inicial?"}</legend><div className="survey-checks">{dashboardOptions.map(option => <label key={option}><input type="checkbox" name="dashboard" value={option} />{option}</label>)}</div></fieldset>
      <div className="survey-columns"><fieldset><legend>7. {en ? "How important is mobile access?" : "Qual é a importância do acesso pelo celular?"}</legend><select name="mobile" required><option>{en ? "Essential" : "Indispensável"}</option><option>{en ? "Important" : "Importante"}</option><option>{en ? "Useful" : "Seria útil"}</option><option>{en ? "Not needed" : "Não é necessário"}</option></select></fieldset><fieldset><legend>8. {en ? "Which tasks should be automated?" : "Quais tarefas deveriam ser automatizadas?"}</legend><textarea name="automation" /></fieldset></div>
      <fieldset><legend>9. {en ? "What support channel do you prefer?" : "Qual tipo de suporte você prefere?"}</legend><div className="survey-checks compact">{["WhatsApp", "Chat", "Telefone", "Videoconferência", "Tutoriais", "Atendimento 24 horas"].map(option => <label key={option}><input type="checkbox" name="support" value={option} />{option}</label>)}</div></fieldset>
      <fieldset><legend>10. {en ? "What would make you switch your current system to Venda Mais?" : "O que faria você trocar seu sistema atual pelo Venda Mais?"}</legend><textarea name="reason" /></fieldset>
      <div className="survey-columns"><fieldset><legend>11. {en ? "What monthly price seems appropriate?" : "Qual valor mensal considera adequado?"}</legend><input name="budget" placeholder="R$" /></fieldset><fieldset><legend>12. {en ? "Is there an essential feature we did not mention?" : "Existe alguma função indispensável que não mencionamos?"}</legend><textarea name="essential" /></fieldset></div>
      <div className="survey-submit"><div><strong>{en ? "Your answers go directly to our team." : "Suas respostas vão diretamente para nossa equipe."}</strong><small>{en ? "When you finish, WhatsApp will open with the completed survey. Review it and tap send." : "Ao finalizar, o WhatsApp abrirá com o questionário preenchido. Confira e toque em enviar."}</small></div><button>{en ? "Finish and send" : "Finalizar e enviar"}</button></div>
    </form>
  </section>;
}
