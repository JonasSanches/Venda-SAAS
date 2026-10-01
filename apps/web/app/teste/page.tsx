import { redirect } from "next/navigation";

/** Endereço antigo preservado para links já compartilhados. */
export default function TesteRedirect() {
  redirect("/cadastro");
}
