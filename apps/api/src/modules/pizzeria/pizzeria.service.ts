import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { withTenant } from "@varejo/database";
import { tenantContext } from "../../common/tenant-context";
import { calculateFlavorPrice } from "./pizza-pricing";
import { PizzeriaDemoStore } from "./pizzeria-demo-store.service";

const MODULE = "PIZZERIA";
type Rule = "HIGHEST_PRICE"|"AVERAGE"|"PROPORTIONAL";

@Injectable()
export class PizzeriaService {
  constructor(private readonly demo:PizzeriaDemoStore) {}
  private get demoMode(){return process.env.DEMO_MODE!=="false"}
  async configuration(tenantId:string) {
    if(this.demoMode)return this.demo.configuration(tenantId);
    return withTenant(tenantId, async tx => {
      const [module, settings, sizes, flavors, doughs, crusts, modifiers, pizzas] = await Promise.all([
        tx.tenantModule.findUnique({where:{tenantId_module:{tenantId,module:MODULE}}}),
        tx.pizzaSettings.findUnique({where:{tenantId}}),
        tx.pizzaSize.findMany({where:{tenantId},orderBy:{name:"asc"}}),
        tx.pizzaFlavor.findMany({where:{tenantId},orderBy:{name:"asc"}}),
        tx.pizzaDough.findMany({where:{tenantId},orderBy:{name:"asc"}}),
        tx.pizzaCrust.findMany({where:{tenantId},orderBy:{name:"asc"}}),
        tx.pizzaModifier.findMany({where:{tenantId},orderBy:[{kind:"asc"},{name:"asc"}]}),
        tx.pizzaProduct.findMany({where:{tenantId},include:{product:true,sizes:{include:{size:true}},flavors:{include:{flavor:true}},modifiers:{include:{modifier:true}}},orderBy:{product:{name:"asc"}}}),
      ]);
      return { enabled:Boolean(module?.enabled), pricingRule:settings?.pricingRule??"HIGHEST_PRICE", sizes:this.numberRows(sizes), flavors, doughs, crusts, modifiers:this.numberRows(modifiers), pizzas:pizzas.map((pizza:any)=>this.serializePizza(pizza)) };
    });
  }

  async setModule(tenantId:string, enabled:boolean) {
    this.assertManager();
    if(this.demoMode)return this.demo.setModule(tenantId,enabled);
    return withTenant(tenantId, async tx => {
      const module = await tx.tenantModule.upsert({where:{tenantId_module:{tenantId,module:MODULE}},update:{enabled},create:{tenantId,module:MODULE,enabled}});
      if(enabled) await tx.pizzaSettings.upsert({where:{tenantId},update:{},create:{tenantId}});
      return { enabled:module.enabled };
    });
  }

  async setPricingRule(tenantId:string, pricingRule:Rule) {
    this.assertManager(); if(this.demoMode)return this.demo.setPricingRule(tenantId,pricingRule); await this.requireEnabled(tenantId);
    return withTenant(tenantId, tx=>tx.pizzaSettings.upsert({where:{tenantId},update:{pricingRule},create:{tenantId,pricingRule}}));
  }
  async addSize(tenantId:string, input:{name:string;maxFlavors:number;serves?:number}) { this.assertManager(); if(this.demoMode)return this.demo.addSize(tenantId,input); await this.requireEnabled(tenantId); return withTenant(tenantId, async tx=>{const size=await tx.pizzaSize.create({data:{tenantId,name:input.name.trim(),maxFlavors:input.maxFlavors,serves:input.serves}});const[doughs,crusts]=await Promise.all([tx.pizzaDough.findMany({where:{tenantId,active:true}}),tx.pizzaCrust.findMany({where:{tenantId,active:true}})]);if(doughs.length)await tx.pizzaDoughSize.createMany({data:doughs.map((dough:any)=>({tenantId,doughId:dough.id,sizeId:size.id,price:0}))});if(crusts.length)await tx.pizzaCrustSize.createMany({data:crusts.map((crust:any)=>({tenantId,crustId:crust.id,sizeId:size.id,price:0}))});return size;}); }
  async addFlavor(tenantId:string, name:string) { this.assertManager(); if(this.demoMode)return this.demo.addNamed(tenantId,"flavors",name); await this.requireEnabled(tenantId); return withTenant(tenantId, tx=>tx.pizzaFlavor.create({data:{tenantId,name:name.trim()}})); }
  async addDough(tenantId:string, name:string) { this.assertManager(); if(this.demoMode)return this.demo.addNamed(tenantId,"doughs",name); await this.requireEnabled(tenantId); return withTenant(tenantId, async tx=>{const sizes=await tx.pizzaSize.findMany({where:{tenantId,active:true}});return tx.pizzaDough.create({data:{tenantId,name:name.trim(),sizes:{create:sizes.map((size:any)=>({tenantId,sizeId:size.id,price:0}))}}});}); }
  async addCrust(tenantId:string, name:string) { this.assertManager(); if(this.demoMode)return this.demo.addNamed(tenantId,"crusts",name); await this.requireEnabled(tenantId); return withTenant(tenantId, async tx=>{const sizes=await tx.pizzaSize.findMany({where:{tenantId,active:true}});return tx.pizzaCrust.create({data:{tenantId,name:name.trim(),sizes:{create:sizes.map((size:any)=>({tenantId,sizeId:size.id,price:0}))}}});}); }
  async addModifier(tenantId:string, input:{name:string;kind:"ADDITION"|"REMOVAL";price:number}) { this.assertManager(); if(this.demoMode)return this.demo.addModifier(tenantId,input); await this.requireEnabled(tenantId); return withTenant(tenantId, tx=>tx.pizzaModifier.create({data:{tenantId,name:input.name.trim(),kind:input.kind,price:input.price}}).then((row:any)=>this.numberRow(row))); }

  async createPizza(tenantId:string, input:any) {
    this.assertManager(); if(this.demoMode)return this.demo.createPizza(tenantId,input); await this.requireEnabled(tenantId);
    return withTenant(tenantId, async tx => {
      const [sizes, flavors, modifiers] = await Promise.all([
        tx.pizzaSize.findMany({where:{tenantId,id:{in:input.sizes.map((x:any)=>x.sizeId)},active:true}}),
        tx.pizzaFlavor.findMany({where:{tenantId,id:{in:input.flavors.map((x:any)=>x.flavorId)},active:true}}),
        tx.pizzaModifier.findMany({where:{tenantId,id:{in:input.modifierIds??[]},active:true}}),
      ]);
      if(sizes.length!==input.sizes.length || new Set(input.sizes.map((x:any)=>x.sizeId)).size!==input.sizes.length) throw new BadRequestException("One or more pizza sizes are invalid.");
      if(flavors.length!==input.flavors.length || new Set(input.flavors.map((x:any)=>x.flavorId)).size!==input.flavors.length) throw new BadRequestException("One or more pizza flavors are invalid.");
      if(modifiers.length!==(input.modifierIds??[]).length || new Set(input.modifierIds??[]).size!==(input.modifierIds??[]).length) throw new BadRequestException("One or more modifiers are invalid.");
      const product = await tx.product.create({data:{tenantId,sku:input.sku.trim(),name:input.name.trim(),price:Math.min(...input.sizes.map((x:any)=>x.price)),ncm:input.ncm,kind:"PIZZA"}});
      const pizza = await tx.pizzaProduct.create({data:{tenantId,productId:product.id,availableFrom:input.availableFrom,availableTo:input.availableTo,sizes:{create:input.sizes.map((x:any)=>({tenantId,sizeId:x.sizeId,price:x.price}))},flavors:{create:input.flavors.map((x:any)=>({tenantId,flavorId:x.flavorId,price:x.price}))},modifiers:{create:(input.modifierIds??[]).map((modifierId:string)=>({tenantId,modifierId}))}},include:{product:true,sizes:{include:{size:true}},flavors:{include:{flavor:true}},modifiers:{include:{modifier:true}}}});
      return this.serializePizza(pizza);
    });
  }

  // A quote is deliberately produced only on the server. The browser sends choices,
  // never a final price, so a later checkout can reuse this same rule safely.
  async quote(tenantId:string, input:any) {
    if(this.demoMode)return this.demo.quote(tenantId,input); await this.requireEnabled(tenantId);
    return withTenant(tenantId, async tx => {
      const pizza = await tx.pizzaProduct.findFirst({where:{id:input.pizzaProductId,tenantId,active:true},include:{product:true,sizes:{include:{size:true}},flavors:{include:{flavor:true}},modifiers:{include:{modifier:true}}}});
      if(!pizza) throw new NotFoundException("Pizza not found.");
      const selectedSize=pizza.sizes.find((item:any)=>item.sizeId===input.sizeId && item.size.active);
      if(!selectedSize) throw new BadRequestException("This size is not available for the pizza.");
      const ids=input.flavors.map((item:any)=>item.id);
      if(new Set(ids).size!==ids.length || ids.length>selectedSize.size.maxFlavors) throw new BadRequestException("The selected flavors exceed this pizza size limit.");
      const selectedFlavors=ids.map((id:string)=>pizza.flavors.find((item:any)=>item.flavorId===id && item.flavor.active));
      if(selectedFlavors.some((item:any)=>!item)) throw new BadRequestException("One or more selected flavors are unavailable.");
      const fraction=input.flavors.reduce((sum:number,item:any)=>sum+item.fraction,0);
      if(Math.abs(fraction-1)>0.001) throw new BadRequestException("Flavor fractions must add up to 1.");
      const rule=(await tx.pizzaSettings.findUnique({where:{tenantId}}))?.pricingRule??"HIGHEST_PRICE";
      const flavorAmount=calculateFlavorPrice(rule as Rule,Number(selectedSize.price),selectedFlavors.map((item:any,index:number)=>({price:Number(item.price),fraction:input.flavors[index].fraction})));
      const allowedModifiers=pizza.modifiers.filter((item:any)=>input.modifierIds?.includes(item.modifierId) && item.modifier.active);
      if(allowedModifiers.length!==(input.modifierIds??[]).length) throw new BadRequestException("One or more modifiers are not available for this pizza.");
      const modifierAmount=allowedModifiers.reduce((sum:number,item:any)=>sum+Number(item.modifier.price),0);
      const dough=input.doughId?await tx.pizzaDoughSize.findFirst({where:{tenantId,doughId:input.doughId,sizeId:input.sizeId,dough:{active:true}}}):null;
      const crust=input.crustId?await tx.pizzaCrustSize.findFirst({where:{tenantId,crustId:input.crustId,sizeId:input.sizeId,crust:{active:true}}}):null;
      if(input.doughId&&!dough) throw new BadRequestException("This dough is not available for the selected size.");
      if(input.crustId&&!crust) throw new BadRequestException("This crust is not available for the selected size.");
      const doughAmount=Number(dough?.price??0),crustAmount=Number(crust?.price??0),total=flavorAmount+modifierAmount+doughAmount+crustAmount;
      return { pizzaProductId:pizza.id, productId:pizza.productId, sizeId:input.sizeId, pricingRule:rule, flavorAmount:Number(flavorAmount.toFixed(2)), doughAmount, crustAmount, modifierAmount:Number(modifierAmount.toFixed(2)), total:Number(total.toFixed(2)) };
    });
  }

  async operations(tenantId:string) {
    if(this.demoMode)return this.demo.operations(tenantId); await this.requireEnabled(tenantId);
    return withTenant(tenantId, async tx => {
      const orders=await tx.pizzaOrder.findMany({where:{tenantId,status:{notIn:["COMPLETED","CANCELLED"]}},include:{items:{include:{pizza:{include:{product:true}}}}},orderBy:{createdAt:"asc"},take:80});
      const today=new Date();today.setHours(0,0,0,0);
      const [todayOrders,paid]=await Promise.all([
        tx.pizzaOrder.count({where:{tenantId,createdAt:{gte:today},status:{not:"CANCELLED"}}}),
        tx.pizzaOrder.aggregate({where:{tenantId,createdAt:{gte:today},paymentState:"PAID",status:{not:"CANCELLED"}},_sum:{total:true}}),
      ]);
      const byStatus=orders.reduce<Record<string,number>>((all,order:any)=>({...all,[order.status]:(all[order.status]??0)+1}),{});
      return { orders:orders.map((order:any)=>this.serializeOrder(order)), summary:{todayOrders,paidRevenue:Number(paid._sum.total??0),new:byStatus.NEW??0,preparing:(byStatus.PREPARING??0)+(byStatus.OVEN??0),ready:(byStatus.READY??0)+(byStatus.OUT_FOR_DELIVERY??0)} };
    });
  }

  async createOrder(tenantId:string, input:any) {
    this.assertOperator(); if(this.demoMode)return this.demo.createOrder(tenantId,input); await this.requireEnabled(tenantId);
    const quotes=await Promise.all(input.items.map((item:any)=>this.quote(tenantId,item)));
    return withTenant(tenantId, async tx => {
      const last=await tx.pizzaOrder.findFirst({where:{tenantId},orderBy:{number:"desc"},select:{number:true}});
      const total=quotes.reduce((sum,quote,index)=>sum+quote.total*input.items[index].quantity,0);
      const order=await tx.pizzaOrder.create({data:{tenantId,number:(last?.number??0)+1,serviceType:input.serviceType,customerName:input.customerName?.trim()||null,customerPhone:input.customerPhone?.trim()||null,address:input.address?.trim()||null,notes:input.notes?.trim()||null,total,items:{create:input.items.map((item:any,index:number)=>({tenantId,pizzaProductId:quotes[index].pizzaProductId,quantity:item.quantity,unitPrice:quotes[index].total,total:quotes[index].total*item.quantity,selection:{sizeId:item.sizeId,flavors:item.flavors,doughId:item.doughId??null,crustId:item.crustId??null,modifierIds:item.modifierIds??[],pricingRule:quotes[index].pricingRule}}))}},include:{items:{include:{pizza:{include:{product:true}}}}}});
      return this.serializeOrder(order);
    });
  }

  async setOrderStatus(tenantId:string,id:string,status:any) {
    this.assertOperator(); if(this.demoMode)return this.demo.setStatus(tenantId,id,status); await this.requireEnabled(tenantId);
    return withTenant(tenantId,async tx=>{const order=await tx.pizzaOrder.findFirst({where:{id,tenantId}});if(!order)throw new NotFoundException("Pizza order not found.");if(order.status==="COMPLETED"||order.status==="CANCELLED")throw new BadRequestException("Closed orders cannot be changed.");const updated=await tx.pizzaOrder.update({where:{id},data:{status},include:{items:{include:{pizza:{include:{product:true}}}}}});return this.serializeOrder(updated);});
  }

  async setOrderPayment(tenantId:string,id:string,paid:boolean) {
    this.assertOperator(); if(this.demoMode)return this.demo.setPayment(tenantId,id,paid); await this.requireEnabled(tenantId);
    return withTenant(tenantId,async tx=>{const order=await tx.pizzaOrder.findFirst({where:{id,tenantId}});if(!order)throw new NotFoundException("Pizza order not found.");const updated=await tx.pizzaOrder.update({where:{id},data:{paymentState:paid?"PAID":"PENDING"},include:{items:{include:{pizza:{include:{product:true}}}}}});return this.serializeOrder(updated);});
  }

  private async requireEnabled(tenantId:string) { const enabled=await withTenant(tenantId,tx=>tx.tenantModule.findFirst({where:{tenantId,module:MODULE,enabled:true},select:{id:true}})); if(!enabled) throw new ForbiddenException("Enable the Pizzeria module before using this feature."); }
  private assertManager(){ const roles=tenantContext.getStore()?.roles??[]; if(!roles.includes("ADMIN")&&!roles.includes("MANAGER")&&!roles.includes("PLATFORM_ADMIN")) throw new ForbiddenException("Only administrators and managers can configure the Pizzeria module."); }
  private assertOperator(){ const roles=tenantContext.getStore()?.roles??[]; if(!roles.some(role=>["ADMIN","MANAGER","CASHIER","PLATFORM_ADMIN"].includes(role))) throw new ForbiddenException("Your role cannot operate pizza orders."); }
  private numberRow(row:any){ return {...row,price:row.price===undefined?undefined:Number(row.price)}; }
  private numberRows(rows:any[]){ return rows.map(row=>this.numberRow(row)); }
  private serializePizza(pizza:any){ return {id:pizza.id,productId:pizza.productId,name:pizza.product.name,sku:pizza.product.sku,active:pizza.active,availableFrom:pizza.availableFrom,availableTo:pizza.availableTo,sizes:pizza.sizes.map((item:any)=>({id:item.sizeId,name:item.size.name,maxFlavors:item.size.maxFlavors,price:Number(item.price)})),flavors:pizza.flavors.map((item:any)=>({id:item.flavorId,name:item.flavor.name,price:Number(item.price)})),modifiers:pizza.modifiers.map((item:any)=>this.numberRow(item.modifier))}; }
  private serializeOrder(order:any){return{id:order.id,number:order.number,status:order.status,serviceType:order.serviceType,paymentState:order.paymentState,customerName:order.customerName,customerPhone:order.customerPhone,address:order.address,notes:order.notes,total:Number(order.total),createdAt:order.createdAt.toISOString(),items:order.items.map((item:any)=>({id:item.id,name:item.pizza.product.name,quantity:item.quantity,unitPrice:Number(item.unitPrice),total:Number(item.total),selection:item.selection}))};}
}
