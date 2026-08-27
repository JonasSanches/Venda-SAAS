import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/public.decorator";
import { prisma } from "@varejo/database";

@Public()
@Controller("health")
export class HealthController {
  @Get("live")
  live() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("ready")
  async ready() {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready", database: "connected", timestamp: new Date().toISOString() };
  }
}
