import{BadRequestException,Injectable}from"@nestjs/common";
import{prisma}from"@varejo/database";
import type{FastifyRequest}from"fastify";
import{SurveyDto,VisitDto}from"./analytics.dto";

const allowed=new Set(["/","/teste","/pagamento","/biblioteca","/biblioteca/membros","/privacidade","/sistemas-jundiai"]);
const text=(value:unknown,limit:number)=>{if(typeof value!=="string")return undefined;let decoded=value;try{decoded=decodeURIComponent(value)}catch{}const result=decoded.trim();return result?result.slice(0,limit):undefined};
function clientIp(request:FastifyRequest){const forwarded=request.headers["x-forwarded-for"],first=Array.isArray(forwarded)?forwarded[0]:forwarded?.split(",")[0];return text(first,64)??text(request.headers["x-real-ip"],64)??text(request.ip,64)}
function deviceInfo(value:string){const ua=value.toLowerCase();return{device:/mobile|android|iphone|ipad/.test(ua)?"Celular/tablet":"Computador",browser:ua.includes("edg/")?"Edge":ua.includes("chrome/")?"Chrome":ua.includes("firefox/")?"Firefox":ua.includes("safari/")?"Safari":"Outro",operatingSystem:ua.includes("windows")?"Windows":ua.includes("iphone")||ua.includes("ipad")?"iOS":ua.includes("android")?"Android":ua.includes("mac os")?"macOS":ua.includes("linux")?"Linux":"Outro"}}
@Injectable()
export class AnalyticsService{
  async record(input:VisitDto,request:FastifyRequest){const cleanPath=input.path.split("?")[0];if(!allowed.has(cleanPath))return{ok:true};const ipAddress=clientIp(request),recent=ipAddress?await prisma.visitorEvent.findFirst({where:{ipAddress,path:cleanPath,visitedAt:{gte:new Date(Date.now()-5*60_000)}},select:{id:true}}):null;if(recent)return{ok:true};const ua=text(request.headers["user-agent"],1000)??"",technical=deviceInfo(ua);await prisma.visitorEvent.create({data:{...technical,path:cleanPath,referrer:text(input.referrer??request.headers.referer,1000),ipAddress,userAgent:ua,language:text(input.language??request.headers["accept-language"],120),timezone:text(input.timezone,120),platform:text(input.platform,160),screenWidth:input.screenWidth,screenHeight:input.screenHeight,viewportWidth:input.viewportWidth,viewportHeight:input.viewportHeight,country:text(request.headers["x-vercel-ip-country"]??request.headers["cf-ipcountry"],80),region:text(request.headers["x-vercel-ip-country-region"],100),city:text(request.headers["x-vercel-ip-city"],120)}});return{ok:true}}
  async saveSurvey(input:SurveyDto,request:FastifyRequest){const serialized=JSON.stringify(input.answers);if(serialized.length>20_000)throw new BadRequestException("As respostas ultrapassaram o limite permitido");const ipAddress=clientIp(request),recent=ipAddress?await prisma.surveyResponse.findFirst({where:{ipAddress,submittedAt:{gte:new Date(Date.now()-5*60_000)}},select:{id:true}}):null;if(recent)throw new BadRequestException("Aguarde alguns minutos antes de enviar outra resposta");const answers=JSON.parse(serialized);return prisma.surveyResponse.create({data:{name:input.name.trim(),company:input.company.trim(),contact:input.contact.trim(),language:input.language,ipAddress,answers},select:{id:true,submittedAt:true}})}
  async surveys(){return prisma.surveyResponse.findMany({orderBy:{submittedAt:"desc"},take:200})}
  async excludeCurrentIp(request:FastifyRequest){const ipAddress=clientIp(request);if(!ipAddress)return{ok:true};await prisma.visitorExclusion.upsert({where:{ipAddress},create:{ipAddress},update:{}});return{ok:true}}
  async report(daysInput:number,pageInput:number){
    const days=Math.min(Math.max(Number(daysInput)||30,1),365),pageSize=50,since=new Date(Date.now()-days*86_400_000);
    await prisma.visitorEvent.deleteMany({where:{visitedAt:{lt:new Date(Date.now()-365*86_400_000)}}});
    const excluded=await prisma.visitorExclusion.findMany({select:{ipAddress:true}}),excludedIps=excluded.map(item=>item.ipAddress),where={visitedAt:{gte:since},...(excludedIps.length?{ipAddress:{notIn:excludedIps}}:{})};
    const events=await prisma.visitorEvent.findMany({where,orderBy:{visitedAt:"desc"}}),total=events.length,dailyMap=new Map<string,number>(),formatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}),todayKey=formatter.format(new Date());
    for(const item of events){const key=formatter.format(item.visitedAt);dailyMap.set(key,(dailyMap.get(key)??0)+1)}
    const grouped=new Map<string,{visit:(typeof events)[number];paths:string[];pageViews:number}>();
    for(const event of events){
      const key=event.ipAddress??`evento:${event.id.toString()}`,path=event.path.split("?")[0];
      const current=grouped.get(key);
      if(!current){grouped.set(key,{visit:event,paths:allowed.has(path)?[path]:[],pageViews:1});continue}
      current.pageViews+=1;
      if(allowed.has(path)&&!current.paths.includes(path))current.paths.push(path);
      if(!current.visit.referrer&&event.referrer)current.visit={...current.visit,referrer:event.referrer};
    }
    const groupedVisits=[...grouped.values()],uniqueVisitors=new Set(events.map(item=>item.ipAddress).filter(Boolean)).size,totalRows=groupedVisits.length,totalPages=Math.max(Math.ceil(totalRows/pageSize),1),page=Math.min(Math.max(Number(pageInput)||1,1),totalPages),visits=groupedVisits.slice((page-1)*pageSize,page*pageSize).map(({visit:{id,...visit},paths,pageViews})=>({...visit,id:id.toString(),paths,pageViews}));
    return{summary:{total,uniqueVisitors,today:dailyMap.get(todayKey)??0},daily:[...dailyMap].reverse().map(([day,count])=>({day,visits:count})),visits,pagination:{page,pageSize,total:totalRows,totalPages},days};
  }
}
