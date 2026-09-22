export type PizzaPricingRule = "HIGHEST_PRICE"|"AVERAGE"|"PROPORTIONAL";
export type PricedFlavor = { price:number; fraction:number };

export function calculateFlavorPrice(rule:PizzaPricingRule, basePrice:number, flavors:PricedFlavor[]) {
  if(!flavors.length) throw new Error("At least one flavor is required.");
  const values=flavors.map(flavor=>basePrice+flavor.price);
  if(rule==="HIGHEST_PRICE") return Math.max(...values);
  if(rule==="AVERAGE") return values.reduce((total,value)=>total+value,0)/values.length;
  return values.reduce((total,value,index)=>total+value*flavors[index].fraction,0);
}
