import { Injectable } from "@nestjs/common";
import { currentBranchId, currentTenantId } from "../../common/tenant-context";
import { CreateProductDto, ImportProductDto, ProductFiscalDto } from "./product.dto";
import { OperationalStore } from "../demo/operational-store.service";

@Injectable()
export class ProductsService {
  constructor(private readonly store: OperationalStore) {}
  list() { return this.store.stock(currentTenantId(),currentBranchId()); }

  create(input: CreateProductDto) {
    return this.store.addProduct(currentTenantId(), input);
  }
  import(items:ImportProductDto[]){return this.store.importProducts(currentTenantId(),items,currentBranchId())}
  updateFiscal(id:string,input:ProductFiscalDto){return this.store.updateProductFiscal(currentTenantId(),id,input)}
}
