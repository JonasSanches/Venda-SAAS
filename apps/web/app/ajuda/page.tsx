import type { Metadata } from "next";
import { HelpCenter } from "../help-center";

export const metadata: Metadata = {
  title: "Ajuda e treinamento | Venda+",
  description: "Guias práticos para usar vendas, caixa, estoque, produtos, clientes e os módulos do Venda+.",
};

export default function HelpPage() {
  return <main className="help-page"><HelpCenter /></main>;
}
