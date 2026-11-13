import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { withTenant } from "@varejo/database";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { currentTenantId, tenantContext } from "../../common/tenant-context";
import { OrderSettingsDto } from "./order-settings.dto";

const MODULE = "ORDER_ASSISTANT_SETTINGS";
const empty = () => ({ units: [], sellers: [] });
@Injectable()
export class OrderSettingsService {
  private readonly file=resolve(process.cwd(),"../../storage/order-assistant-settings.json");
  private readDemo():Record<string,OrderSettingsDto>{try{return JSON.parse(readFileSync(this.file,"utf8"))}catch{return {}}}
  async get(){
    const tenantId=currentTenantId();
    if(process.env.DEMO_MODE!=="false") return this.readDemo()[tenantId]??empty();
    const entry=await withTenant(tenantId,tx=>tx.tenantModule.findUnique({where:{tenantId_module:{tenantId,module:MODULE}},select:{settings:true}}));
    return entry?.settings??empty();
  }
  async update(input:OrderSettingsDto){
    if(!tenantContext.getStore()?.roles.some(role=>role==="ADMIN"||role==="MANAGER")) throw new ForbiddenException("Somente administradores ou gerentes podem alterar unidades e vendedores.");
    const tenantId=currentTenantId();
    const units=input.units.map(unit=>({name:unit.name.trim(),phone:unit.phone}));
    const sellers=input.sellers.map(name=>name.trim());
    if(new Set(units.map(unit=>unit.name.toLocaleLowerCase("pt-BR"))).size!==units.length || new Set(sellers.map(name=>name.toLocaleLowerCase("pt-BR"))).size!==sellers.length) throw new BadRequestException("Não repita nomes de unidades ou vendedores.");
    const settings={units,sellers};
    if(process.env.DEMO_MODE!=="false"){const all=this.readDemo();all[tenantId]=settings;mkdirSync(dirname(this.file),{recursive:true});writeFileSync(this.file,JSON.stringify(all,null,2));return settings}
    await withTenant(tenantId,tx=>tx.tenantModule.upsert({where:{tenantId_module:{tenantId,module:MODULE}},create:{tenantId,module:MODULE,enabled:true,settings},update:{enabled:true,settings}}));
    return settings;
  }
}
