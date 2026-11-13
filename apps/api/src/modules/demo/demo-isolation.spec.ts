import { describe, expect, it } from "vitest";
import { DemoStore } from "./demo-store.service";

describe("demo dashboards",()=>{
 it("keeps delivery and cash metrics and settings separate for each company",()=>{
  const store=Object.create(DemoStore.prototype) as DemoStore;
  const now=new Date(),old=new Date(now.getTime()-60*60000).toISOString();
  Object.assign(store,{data:{tenant:{id:"a",deliveryAlertMinutes:45},products:[],movements:[],cashMovements:[],orders:[{id:"a1",tenantId:"a",status:"PAID",channel:"DELIVERY",createdAt:old,total:100,items:[]},{id:"b1",tenantId:"b",status:"PAID",channel:"DELIVERY",createdAt:old,total:200,items:[]}],cashSessions:[{tenantId:"a",status:"CLOSED",closedAt:now.toISOString(),difference:7},{tenantId:"b",status:"CLOSED",closedAt:now.toISOString(),difference:33}]},save:()=>{}});
  store.updateDashboardSettings("b",120);
  expect(store.dashboard("a")).toMatchObject({lateDeliveries:1,cashDivergence:7,deliveryAlertMinutes:45});
  expect(store.dashboard("b")).toMatchObject({lateDeliveries:0,cashDivergence:33,deliveryAlertMinutes:120});
 });
});
