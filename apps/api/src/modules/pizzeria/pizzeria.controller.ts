import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { currentTenantId } from "../../common/tenant-context";
import { CreatePizzaDto, ModifierDto, ModuleStatusDto, NamedOptionDto, PizzaQuoteDto, PizzaSizeDto, PricingRuleDto } from "./pizzeria.dto";
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
}
