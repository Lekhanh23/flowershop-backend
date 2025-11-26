import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";


@Controller('products')
export class PublicProductsController {
    constructor(private readonly productsService : ProductsService) {}
    @Get()
    findAll(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('collection_id') collectionId?: number,
    ) {
        return this.productsService.findAllPublic({
            page,
            limit,
            collection_id: collectionId,
        });
    }
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }
}