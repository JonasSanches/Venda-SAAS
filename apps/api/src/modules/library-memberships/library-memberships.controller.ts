import { Body, Controller, Get, Headers, Param, Post, Query, Res, StreamableFile } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { Public } from "../../common/public.decorator";
import { LibraryMembershipCheckoutDto, LibraryMembershipLoginDto } from "./library-memberships.dto";
import { LibraryMembershipsService, libraryMembershipSessionSeconds } from "./library-memberships.service";

const COOKIE_NAME="vendamais_library_member";
const cookieValue=(header:string|undefined)=>{try{const pair=header?.split(";").map(item=>item.trim()).find(item=>item.startsWith(`${COOKIE_NAME}=`));return pair?decodeURIComponent(pair.slice(COOKIE_NAME.length+1)):undefined}catch{return undefined}};
const sessionCookie=(value?:string)=>[`${COOKIE_NAME}=${encodeURIComponent(value??"")}`,"Path=/api/library-memberships","HttpOnly","SameSite=Lax",value?`Max-Age=${libraryMembershipSessionSeconds}`:"Max-Age=0",...(process.env.NODE_ENV==="production"?["Secure"]:[])].join("; ");

@Controller("library-memberships")
export class LibraryMembershipsController{
  constructor(private readonly memberships:LibraryMembershipsService){}
  @Public()@Post("checkout")checkout(@Body()input:LibraryMembershipCheckoutDto){return this.memberships.checkout(input.email,input.password)}
  @Public()@Post("webhook")webhook(@Body()body:any,@Query("data.id")queryId?:string,@Query("id")id?:string){return this.memberships.webhook(String(body?.data?.id??queryId??id??""))}
  @Public()@Get("purchases/:id")async purchaseStatus(@Param("id")id:string,@Query("token")token:string,@Res({passthrough:true})reply:FastifyReply){const result=await this.memberships.purchaseStatus(id,token);if(result.sessionToken)reply.header("Set-Cookie",sessionCookie(result.sessionToken));const{sessionToken,...safe}=result;return safe}
  @Public()@Post("login")async login(@Body()input:LibraryMembershipLoginDto,@Res({passthrough:true})reply:FastifyReply){const result=await this.memberships.login(input.email,input.password);reply.header("Set-Cookie",sessionCookie(result.sessionToken));return{member:result.member}}
  @Public()@Post("logout")async logout(@Headers("cookie")cookie:string|undefined,@Res({passthrough:true})reply:FastifyReply){const result=await this.memberships.logout(cookieValue(cookie));reply.header("Set-Cookie",sessionCookie());return result}
  @Public()@Get("me")async me(@Headers("cookie")cookie?:string){return{member:await this.memberships.me(cookieValue(cookie))}}
  @Public()@Get("books")catalog(@Headers("cookie")cookie?:string){return this.memberships.catalog(cookieValue(cookie))}
  @Public()@Get("books/:slug/:format/download")async download(@Param("slug")slug:string,@Param("format")format:string,@Headers("cookie")cookie:string|undefined,@Res({passthrough:true})reply:FastifyReply){const file=await this.memberships.download(cookieValue(cookie),slug,format);reply.header("Content-Type",file.type);reply.header("Content-Disposition",`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);reply.header("Cache-Control","private, no-store");return new StreamableFile(file.stream)}
}
