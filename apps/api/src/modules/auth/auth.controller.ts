import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/public.decorator";
import { currentTenantId, tenantContext } from "../../common/tenant-context";
import { DemoStore } from "../demo/demo-store.service";
import { ChangePasswordDto, CreateTenantUserDto, LoginDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { TrialService } from "../platform/trial.service";

@ApiTags("auth") @Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly store: DemoStore,private readonly trials:TrialService) {}
  @Public() @Post("login") login(@Body() input: LoginDto) { return this.auth.login(input.access, input.password); }
  @Get("me") async me() { const id=currentTenantId();const tenant=await this.trials.get(id);return { identity: tenantContext.getStore(), tenant: tenant??this.store.tenant(), users: tenant?.user?[tenant.user]:this.store.users(id) }; }
  @Get("users") users(){return this.auth.listUsers()}
  @Post("users") createUser(@Body()input:CreateTenantUserDto){return this.auth.createUser(input)}
  @Patch("password") changePassword(@Body()input:ChangePasswordDto){return this.auth.changePassword(input)}
}
