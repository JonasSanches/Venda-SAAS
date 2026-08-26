import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/public.decorator";

@Public()
@Controller("health")
export class HealthController {
  @Get("live")
  live() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
