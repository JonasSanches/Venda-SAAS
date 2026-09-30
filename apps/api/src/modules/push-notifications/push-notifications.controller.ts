import { Body, Controller, Get, Post } from "@nestjs/common";
import { currentUserId } from "../../common/tenant-context";
import { PushSubscriptionDto } from "./push-notifications.dto";
import { PushNotificationsService } from "./push-notifications.service";

@Controller("push")
export class PushNotificationsController {
  constructor(private readonly service: PushNotificationsService) {}
  @Get("public-key") key() { return this.service.publicKey(); }
  @Post("subscribe") subscribe(@Body() input: PushSubscriptionDto) { return this.service.subscribe(currentUserId(), input); }
  @Post("test") test() { return this.service.sendTest(currentUserId()); }
}
