import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Collection } from 'src/collections/entities/collection.entity';
import { PublicProductsController } from './public-products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Collection])],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}