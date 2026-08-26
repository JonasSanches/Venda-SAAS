import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateProductDto, ProductFiscalDto } from "./product.dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@ApiBearerAuth()
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list() { return this.products.list(); }
  @Post() create(@Body() input: CreateProductDto) { return this.products.create(input); }
  @Put(":id/fiscal") fiscal(@Param("id") id:string,@Body() input:ProductFiscalDto){return this.products.updateFiscal(id,input)}
}
