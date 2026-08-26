import { Injectable } from "@nestjs/common";
import { currentTenantId } from "../../common/tenant-context";
import { CreateProductDto, ProductFiscalDto } from "./product.dto";
import { OperationalStore } from "../demo/operational-store.service";

@Injectable()
export class ProductsService {
  constructor(private readonly store: OperationalStore) {}
  list() { return this.store.stock(currentTenantId()); }

  create(input: CreateProductDto) {
    return this.store.addProduct(currentTenantId(), input);
  }
  updateFiscal(id:string,input:ProductFiscalDto){return this.store.updateProductFiscal(currentTenantId(),id,input)}
}
