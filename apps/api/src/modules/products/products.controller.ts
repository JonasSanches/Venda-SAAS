import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateProductDto, ImportProductsDto, ProductCostDto, ProductFiscalDto } from "./product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list() { return this.products.list(); }
  @Post() create(@Body() input: CreateProductDto) { return this.products.create(input); }
  @Post("import") import(@Body() input:ImportProductsDto){return this.products.import(input.items)}
  @Put(":id/cost") cost(@Param("id") id:string,@Body() input:ProductCostDto){return this.products.updateCost(id,input.cost)}
  @Put(":id/fiscal") fiscal(@Param("id") id:string,@Body() input:ProductFiscalDto){return this.products.updateFiscal(id,input)}
}
