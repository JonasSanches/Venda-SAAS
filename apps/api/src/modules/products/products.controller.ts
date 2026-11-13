import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateProductDto, ImportProductsDto, ProductCostDto, ProductFiscalDto, ProductImageDto, UpdateOrderProductDto } from "./product.dto";
import { ProductsService } from "./products.service";
import { OrderSettingsService } from "./order-settings.service";
import { OrderSettingsDto } from "./order-settings.dto";

@ApiTags("products")
@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService, private readonly settings: OrderSettingsService) {}
  @Get() list() { return this.products.list(); }
  @Post() create(@Body() input: CreateProductDto) { return this.products.create(input); }
  @Get("order-settings") getOrderSettings(){return this.settings.get()}
  @Put("order-settings") updateOrderSettings(@Body() input:OrderSettingsDto){return this.settings.update(input)}
  @Post("import") import(@Body() input:ImportProductsDto){return this.products.import(input.items)}
  @Put(":id/order-details") orderDetails(@Param("id") id:string,@Body() input:UpdateOrderProductDto){return this.products.updateOrderDetails(id,input)}
  @Put(":id/image") image(@Param("id") id:string,@Body() input:ProductImageDto){return this.products.updateImage(id,input.imageDataUrl)}
  @Put(":id/cost") cost(@Param("id") id:string,@Body() input:ProductCostDto){return this.products.updateCost(id,input.cost)}
  @Put(":id/fiscal") fiscal(@Param("id") id:string,@Body() input:ProductFiscalDto){return this.products.updateFiscal(id,input)}
}
