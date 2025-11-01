import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entities/cart-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem])],
  providers: [],
  controllers: [],
  exports: [],
})
export class CartItemsModule {}