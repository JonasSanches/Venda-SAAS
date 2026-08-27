import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { Public } from "../../common/public.decorator";
import { tenantContext } from "../../common/tenant-context";
import {
  ExtendTrialDto,
  PlatformUserDto,
  ResetTenantPasswordDto,
  TenantStatusDto,
  TenantUserRoleDto,
  TenantUserStatusDto,
  TrialDto,
  UpdateTenantDto,
} from "./trial.dto";
import { TrialService } from "./trial.service";
@Controller("platform")
export class PlatformController {
  constructor(private s: TrialService) {}
  private admin(request: PlatformRequest) {
    if (
      request.identity?.tenantId !== "10000000-0000-4000-8000-000000000001" ||
      !request.identity.roles.includes("PLATFORM_ADMIN")
    )
      throw new ForbiddenException("Acesso exclusivo da plataforma");
  }
  @Public() @Post("trials") create(@Body() i: TrialDto) {
    return this.s.create(i);
  }
  @Get("trial") current() {
    return this.s.get(tenantContext.getStore()!.tenantId);
  }
  @Get("trials") list(@Req() request: PlatformRequest) {
    this.admin(request);
    return this.s.list();
  }
  @Get("trials/:id") detail(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
  ) {
    this.admin(request);
    return this.s.getDetail(id);
  }
  @Get("trials/:id/audit") audit(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
  ) {
    this.admin(request);
    return this.s.auditLogs(id);
  }
  @Get("users") users(@Req() request: PlatformRequest) {
    this.admin(request);
    return this.s.listPlatformUsers();
  }
  @Post("users") addUser(
    @Req() request: PlatformRequest,
    @Body() i: PlatformUserDto,
  ) {
    this.admin(request);
    return this.s.createPlatformUser(i);
  }
  @Post("trials/:id/update") update(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
    @Body() i: UpdateTenantDto,
  ) {
    this.admin(request);
    return this.s.updateTenant(id, i);
  }
  @Post("trials/:id/status") status(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
    @Body() i: TenantStatusDto,
  ) {
    this.admin(request);
    return this.s.setTenantStatus(id, i.status);
  }
  @Post("trials/:id/approve") approve(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
  ) {
    this.admin(request);
    return this.s.approveTrial(id);
  }
  @Post("trials/:id/users/:userId/password") resetPassword(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() i: ResetTenantPasswordDto,
  ) {
    this.admin(request);
    return this.s.resetTenantUserPassword(id, userId, i.newPassword);
  }
  @Post("trials/:id/users/:userId/status") userStatus(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() i: TenantUserStatusDto,
  ) {
    this.admin(request);
    return this.s.setTenantUserStatus(id, userId, i.status);
  }
  @Post("trials/:id/users/:userId/role") userRole(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() i: TenantUserRoleDto,
  ) {
    this.admin(request);
    return this.s.setTenantUserRole(id, userId, i.role);
  }
  @Post("trials/:id/activate") activate(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
  ) {
    this.admin(request);
    return this.s.activate(id);
  }
  @Post("trials/:id/extend") extend(
    @Req() request: PlatformRequest,
    @Param("id") id: string,
    @Body() i: ExtendTrialDto,
  ) {
    this.admin(request);
    return this.s.extend(id, i.days);
  }
}
type PlatformRequest = FastifyRequest & {
  identity?: { tenantId: string; userId: string; roles: string[]; exp: number };
};
