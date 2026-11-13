export type OrderMessageItem = {name:string;price:number;quantity:number;area?:number;coverage?:number};
export function whatsappPhone(value:string):string|null {
  const digits=value.replace(/\D/g,"");
  if(/^\d{10,11}$/.test(digits)) return `55${digits}`;
  return /^55\d{10,11}$/.test(digits)?digits:null;
}
export function orderMessage(input:{company:string;customer:string;address:string;unit:string;seller:string;items:OrderMessageItem[]}):string {
  const money=(value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const lines=input.items.map(item=>`• ${item.name}\n  ${item.quantity} un. × ${money(item.price)} = ${money(item.quantity*item.price)}${item.area?`\n  Área: ${item.area.toLocaleString("pt-BR")} m² (rendimento: ${item.coverage?.toLocaleString("pt-BR")} m²/un.)`:""}`);
  return [`*Pedido de orçamento — ${input.company}*`,`Unidade: ${input.unit}`,`Vendedor(a): ${input.seller}`,`Cliente: ${input.customer}`,`Endereço: ${input.address}`,"",...lines,"",`*Total estimado: ${money(input.items.reduce((sum,item)=>sum+item.price*item.quantity,0))}*`].join("\n");
}
