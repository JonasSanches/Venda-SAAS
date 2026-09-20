import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { withTenant } from "@varejo/database";

type LoadInput = {
  loadNumber:string; brokerName:string; brokerEmail?:string; brokerPhone?:string;
  origin?:string; destination?:string; rateConfirmationNumber?:string; rateConfirmationTerms?:string;
  rateAmount?:number; detentionFreeMinutes:number; detentionRatePerHour:number;
  detentionMinimumMinutes:number; notes?:string;
};
type ClaimStatus = "DRAFT"|"SUBMITTED"|"PAID"|"DENIED";

@Injectable()
export class TransportationService {
  async dashboard(tenantId:string) {
    return withTenant(tenantId, async tx => {
      const [loads, claims] = await Promise.all([
        tx.transportationLoad.findMany({ where:{tenantId}, include:{claims:{where:{type:"DETENTION"}, orderBy:{createdAt:"desc"}}}, orderBy:{createdAt:"desc"}, take:30 }),
        tx.transportationRecoveryClaim.findMany({where:{tenantId,type:"DETENTION"}}),
      ]);
      const paidAmount=claims.filter(c=>c.status==="PAID").reduce((total,c)=>total+Number(c.requestedAmount),0);
      return {
        metrics:{openLoads:loads.filter(l=>l.status!=="DEPARTED"&&l.status!=="CLOSED").length,readyToClaim:loads.filter(l=>l.status==="DEPARTED"&&!l.claims.length).length,submitted:claims.filter(c=>c.status==="SUBMITTED").length,paidAmount},
        loads: loads.map(load=>this.serializeLoad(load)),
      };
    });
  }

  async createLoad(tenantId:string, input:LoadInput) {
    try {
      return await withTenant(tenantId, async tx => this.serializeLoad(await tx.transportationLoad.create({data:{tenantId,...input}})));
    } catch (error:any) {
      if (error?.code==="P2002") throw new BadRequestException("Load number already exists for this company.");
      throw error;
    }
  }

  async recordArrival(tenantId:string, id:string, occurredAt?:string) {
    return withTenant(tenantId, async tx => {
      const load=await tx.transportationLoad.findFirst({where:{id,tenantId}});
      if(!load) throw new NotFoundException("Load not found.");
      if(load.departureAt) throw new BadRequestException("Departure was already recorded.");
      const arrivalAt=occurredAt?new Date(occurredAt):new Date();
      if(Number.isNaN(arrivalAt.getTime())) throw new BadRequestException("Invalid arrival date.");
      return this.serializeLoad(await tx.transportationLoad.update({where:{id},data:{arrivalAt,status:"ARRIVED"}}));
    });
  }

  async recordDeparture(tenantId:string, id:string, occurredAt?:string) {
    return withTenant(tenantId, async tx => {
      const load=await tx.transportationLoad.findFirst({where:{id,tenantId}});
      if(!load) throw new NotFoundException("Load not found.");
      if(!load.arrivalAt) throw new BadRequestException("Record arrival before departure.");
      const departureAt=occurredAt?new Date(occurredAt):new Date();
      if(Number.isNaN(departureAt.getTime()) || departureAt<=load.arrivalAt) throw new BadRequestException("Departure must be after arrival.");
      return this.serializeLoad(await tx.transportationLoad.update({where:{id},data:{departureAt,status:"DEPARTED"}}));
    });
  }

  async createDetentionClaim(tenantId:string, loadId:string, input:{requestedAmount?:number;currency?:string}) {
    return withTenant(tenantId, async tx => {
      const load=await tx.transportationLoad.findFirst({where:{id:loadId,tenantId}});
      if(!load) throw new NotFoundException("Load not found.");
      if(!load.arrivalAt||!load.departureAt) throw new BadRequestException("Record arrival and departure before creating a detention claim.");
      const existing=await tx.transportationRecoveryClaim.findFirst({where:{loadId,type:"DETENTION"}});
      if(existing) throw new BadRequestException("A detention claim already exists for this load.");
      const elapsedMinutes=Math.max(0,Math.round((load.departureAt.getTime()-load.arrivalAt.getTime())/60000));
      const rawBillable=Math.max(0,elapsedMinutes-load.detentionFreeMinutes);
      const billableMinutes=rawBillable>0&&rawBillable<load.detentionMinimumMinutes?load.detentionMinimumMinutes:rawBillable;
      const calculatedAmount=Number((Math.ceil(billableMinutes/60)*Number(load.detentionRatePerHour)).toFixed(2));
      const claim=await tx.transportationRecoveryClaim.create({data:{
        tenantId,loadId,type:"DETENTION",claimNumber:`DET-${load.loadNumber}-${Date.now().toString().slice(-6)}`,
        elapsedMinutes,billableMinutes,ratePerHour:load.detentionRatePerHour,calculatedAmount,
        requestedAmount:input.requestedAmount??calculatedAmount,currency:(input.currency??"USD").toUpperCase().slice(0,3),
        termsSnapshot:{rateConfirmationNumber:load.rateConfirmationNumber,rateConfirmationTerms:load.rateConfirmationTerms,freeMinutes:load.detentionFreeMinutes,minimumMinutes:load.detentionMinimumMinutes,ratePerHour:Number(load.detentionRatePerHour)},
      }});
      return this.serializeClaim(claim);
    });
  }

  async updateClaimStatus(tenantId:string, id:string, input:{status:ClaimStatus;denialReason?:string;paymentReference?:string}) {
    return withTenant(tenantId, async tx => {
      const claim=await tx.transportationRecoveryClaim.findFirst({where:{id,tenantId,type:"DETENTION"}});
      if(!claim) throw new NotFoundException("Claim not found.");
      if(claim.status==="PAID"||claim.status==="DENIED") throw new BadRequestException("This claim is already closed.");
      if(input.status==="PAID"&&claim.status!=="SUBMITTED") throw new BadRequestException("Submit the claim before marking it paid.");
      if(input.status==="DENIED"&&claim.status!=="SUBMITTED") throw new BadRequestException("Submit the claim before denying it.");
      if(input.status==="DENIED"&&!input.denialReason?.trim()) throw new BadRequestException("Enter the denial reason.");
      const now=new Date();
      return this.serializeClaim(await tx.transportationRecoveryClaim.update({where:{id},data:{status:input.status,denialReason:input.status==="DENIED"?input.denialReason?.trim():null,paymentReference:input.status==="PAID"?input.paymentReference?.trim():null,submittedAt:input.status==="SUBMITTED"?now:claim.submittedAt,paidAt:input.status==="PAID"?now:claim.paidAt,deniedAt:input.status==="DENIED"?now:claim.deniedAt}}));
    });
  }

  private serializeClaim(claim:any){return {...claim,ratePerHour:Number(claim.ratePerHour),calculatedAmount:Number(claim.calculatedAmount),requestedAmount:Number(claim.requestedAmount)};}
  private serializeLoad(load:any){return {...load,rateAmount:load.rateAmount===null?null:Number(load.rateAmount),detentionRatePerHour:Number(load.detentionRatePerHour),claims:load.claims?.map((claim:any)=>this.serializeClaim(claim))??[]};}
}
