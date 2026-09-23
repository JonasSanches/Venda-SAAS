import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { CreatePizzaDto, CreatePizzaOrderDto, ModifierDto, ModuleStatusDto, NamedOptionDto, PizzaOrderPaymentDto, PizzaOrderStatusDto, PizzaQuoteDto, PizzaSizeDto, PricingRuleDto } from "./pizzeria.dto";
import { PizzeriaService } from "./pizzeria.service";

@ApiTags("pizzeria") @ApiBearerAuth() @Controller("pizzeria")
export class PizzeriaController {
  constructor(private readonly service:PizzeriaService) {}
  @Get("configuration") configuration(){ return this.service.configuration(currentTenantId()); }
  @Put("module") module(@Body() input:ModuleStatusDto){ return this.service.setModule(currentTenantId(), input.enabled); }
  @Put("pricing-rule") pricing(@Body() input:PricingRuleDto){ return this.service.setPricingRule(currentTenantId(), input.pricingRule); }
  @Post("sizes") size(@Body() input:PizzaSizeDto){ return this.service.addSize(currentTenantId(), input); }
  @Post("flavors") flavor(@Body() input:NamedOptionDto){ return this.service.addFlavor(currentTenantId(), input.name); }
  @Post("doughs") dough(@Body() input:NamedOptionDto){ return this.service.addDough(currentTenantId(), input.name); }
  @Post("crusts") crust(@Body() input:NamedOptionDto){ return this.service.addCrust(currentTenantId(), input.name); }
  @Post("modifiers") modifier(@Body() input:ModifierDto){ return this.service.addModifier(currentTenantId(), input); }
  @Post("pizzas") pizza(@Body() input:CreatePizzaDto){ return this.service.createPizza(currentTenantId(), input); }
  @Post("quote") quote(@Body() input:PizzaQuoteDto){ return this.service.quote(currentTenantId(), input); }
  @Get("operations") operations(){ return this.service.operations(currentTenantId()); }
  @Post("orders") order(@Body() input:CreatePizzaOrderDto){ return this.service.createOrder(currentTenantId(), input); }
  @Put("orders/:id/status") status(@Param("id") id:string, @Body() input:PizzaOrderStatusDto){ return this.service.setOrderStatus(currentTenantId(), id, input.status); }
  @Put("orders/:id/payment") payment(@Param("id") id:string, @Body() input:PizzaOrderPaymentDto){ return this.service.setOrderPayment(currentTenantId(), id, input.paid); }
}
