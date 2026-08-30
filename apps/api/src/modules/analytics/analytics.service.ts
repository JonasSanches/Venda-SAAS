import{BadRequestException,Injectable}from"@nestjs/common";
import{prisma}from"@varejo/database";
import type{FastifyRequest}from"fastify";
import{SurveyDto,VisitDto}from"./analytics.dto";

const allowed=new Set(["/","/teste","/pagamento"]);
const text=(value:unknown,limit:number)=>{if(typeof value!=="string")return undefined;let decoded=value;try{decoded=decodeURIComponent(value)}catch{}const result=decoded.trim();return result?result.slice(0,limit):undefined};
function clientIp(request:FastifyRequest){const forwarded=request.headers["x-forwarded-for"],first=Array.isArray(forwarded)?forwarded[0]:forwarded?.split(",")[0];return text(first,64)??text(request.headers["x-real-ip"],64)??text(request.ip,64)}
function deviceInfo(value:string){const ua=value.toLowerCase();return{device:/mobile|android|iphone|ipad/.test(ua)?"Celular/tablet":"Computador",browser:ua.includes("edg/")?"Edge":ua.includes("chrome/")?"Chrome":ua.includes("firefox/")?"Firefox":ua.includes("safari/")?"Safari":"Outro",operatingSystem:ua.includes("windows")?"Windows":ua.includes("iphone")||ua.includes("ipad")?"iOS":ua.includes("android")?"Android":ua.includes("mac os")?"macOS":ua.includes("linux")?"Linux":"Outro"}}
@Injectable()
export class AnalyticsService{
  async record(input:VisitDto,request:FastifyRequest){const cleanPath=input.path.split("?")[0];if(!allowed.has(cleanPath))return{ok:true};const ipAddress=clientIp(request),recent=ipAddress?await prisma.visitorEvent.findFirst({where:{ipAddress,path:input.path,visitedAt:{gte:new Date(Date.now()-30_000)}},select:{id:true}}):null;if(recent)return{ok:true};const ua=text(request.headers["user-agent"],1000)??"",technical=deviceInfo(ua);await prisma.visitorEvent.create({data:{...technical,path:input.path,referrer:text(input.referrer??request.headers.referer,1000),ipAddress,userAgent:ua,language:text(input.language??request.headers["accept-language"],120),timezone:text(input.timezone,120),platform:text(input.platform,160),screenWidth:input.screenWidth,screenHeight:input.screenHeight,viewportWidth:input.viewportWidth,viewportHeight:input.viewportHeight,country:text(request.headers["x-vercel-ip-country"]??request.headers["cf-ipcountry"],80),region:text(request.headers["x-vercel-ip-country-region"],100),city:text(request.headers["x-vercel-ip-city"],120)}});return{ok:true}}
  async saveSurvey(input:SurveyDto,request:FastifyRequest){const serialized=JSON.stringify(input.answers);if(serialized.length>20_000)throw new BadRequestException("As respostas ultrapassaram o limite permitido");const ipAddress=clientIp(request),recent=ipAddress?await prisma.surveyResponse.findFirst({where:{ipAddress,submittedAt:{gte:new Date(Date.now()-5*60_000)}},select:{id:true}}):null;if(recent)throw new BadRequestException("Aguarde alguns minutos antes de enviar outra resposta");const answers=JSON.parse(serialized);return prisma.surveyResponse.create({data:{name:input.name.trim(),company:input.company.trim(),contact:input.contact.trim(),language:input.language,ipAddress,answers},select:{id:true,submittedAt:true}})}
  async surveys(){return prisma.surveyResponse.findMany({orderBy:{submittedAt:"desc"},take:200})}
  async report(daysInput:number,pageInput:number){
    const days=Math.min(Math.max(Number(daysInput)||30,1),365),pageSize=50,since=new Date(Date.now()-days*86_400_000);
    await prisma.visitorEvent.deleteMany({where:{visitedAt:{lt:new Date(Date.now()-365*86_400_000)}}});
    const compact=await prisma.visitorEvent.findMany({where:{visitedAt:{gte:since}},select:{visitedAt:true,ipAddress:true},orderBy:{visitedAt:"asc"}}),total=compact.length,totalPages=Math.max(Math.ceil(total/pageSize),1),page=Math.min(Math.max(Number(pageInput)||1,1),totalPages);
    const visits=await prisma.visitorEvent.findMany({where:{visitedAt:{gte:since}},orderBy:{visitedAt:"desc"},skip:(page-1)*pageSize,take:pageSize}),uniqueVisitors=new Set(compact.map(item=>item.ipAddress).filter(Boolean)).size,dailyMap=new Map<string,number>(),formatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}),todayKey=formatter.format(new Date());
    for(const item of compact){const key=formatter.format(item.visitedAt);dailyMap.set(key,(dailyMap.get(key)??0)+1)}
    return{summary:{total,uniqueVisitors,today:dailyMap.get(todayKey)??0},daily:[...dailyMap].map(([day,count])=>({day,visits:count})),visits:visits.map(({id,...visit})=>({...visit,id:id.toString()})),pagination:{page,pageSize,total,totalPages},days};
  }
}
