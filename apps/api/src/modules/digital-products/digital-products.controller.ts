import { Body, Controller, Get, Param, Post, Query, Res, StreamableFile } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { Public } from "../../common/public.decorator";
import { DigitalCheckoutDto } from "./digital-products.dto";
import { DigitalProductsService } from "./digital-products.service";

@Controller("digital-products")
export class DigitalProductsController{
  constructor(private readonly products:DigitalProductsService){}
  @Public()@Get()catalog(){return this.products.catalog()}
  @Public()@Post(":slug/checkout")checkout(@Param("slug")slug:string,@Body()input:DigitalCheckoutDto){return this.products.checkout(slug,input.format,input.email)}
  @Public()@Post("webhook")webhook(@Body()body:any,@Query("data.id")queryId?:string,@Query("id")id?:string){return this.products.webhook(String(body?.data?.id??queryId??id??""))}
  @Public()@Get("purchases/:id")status(@Param("id")id:string,@Query("token")token:string){return this.products.status(id,token)}
  @Public()@Get("purchases/:id/download")async download(@Param("id")id:string,@Query("token")token:string,@Res({passthrough:true})reply:FastifyReply){const file=await this.products.download(id,token);reply.header("Content-Type",file.type);reply.header("Content-Disposition",`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);reply.header("Cache-Control","private, no-store");return new StreamableFile(file.stream)}
}
