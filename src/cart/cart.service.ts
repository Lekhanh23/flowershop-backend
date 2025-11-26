import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(CartItem)
        private cartRepo : Repository<CartItem>,
        @InjectRepository(Product)
        private productRepo : Repository<Product>,
    ) {}
    //Xem giỏ hàng
    async getMyCart(userId: number) {
        return this.cartRepo.find({
            where: {userId},
            relations: ['product', 'service'],
        });
    }
    //Thêm giỏ hàng
    async addToCart(userId: number, dto: AddToCartDto) {
        const {productId, quantity, serviceId} = dto;
        //B1: Kiểm tra sản phẩm
        const product = await this.productRepo.findOneBy({id: productId});
        if(!product) {
            throw new NotFoundException("Sản phẩm không tồn tại!");
        }
        //B2: Kiểm tra trạng thái tồn kho
        if(product.status === 'out_of_stock' || product.stock < quantity) {
            throw new BadRequestException(`Sản phẩm đã hết hàng hoặc không đủ số lượng (Còn: ${product.stock})`);
        }
        //B3: Kiểm tra xem sản phẩm (với dịch vụ tương ứng) đã có trong giỏ chưa
        let cartItem = await this.cartRepo.findOne({
            where: {
                userId,
                productId,
                serviceId: serviceId || IsNull(),
            }
        });
        if(cartItem) {
            const newQuantity = cartItem.quantity + quantity;
            if(product.stock < newQuantity) {
                throw new BadRequestException(`Không đủ hàng. Kho chỉ còn ${product.stock}`);
            }
            cartItem.quantity = newQuantity;
        }else {
            cartItem = this.cartRepo.create({
                userId,
                productId,
                quantity,
                serviceId,
            });
        }
        return this.cartRepo.save(cartItem);
    }

    //Xoá sản phẩm khỏi giỏ hàng
    async removeFromCart(userId: number, itemId: number) {
        const item = await this.cartRepo.findOne({where: {id: itemId, userId}});
        if(!item) {
            throw new NotFoundException("Sản phẩm không có trong giỏ hàng");
        }
        return this.cartRepo.remove(item);
    }

    //Cập nhật số lượng cụ thể
    async updateQuantity (userId: number, itemId: number, quantity: number) {
        const item = await this.cartRepo.findOne({
            where: {id: itemId, userId},
            relations: ['product'],
        });
        if(!item) {
            throw new NotFoundException("Item Not Found");
        }
        if(quantity <= 0) {
            return this.cartRepo.remove(item);
        }
        if(item.product.stock < quantity) {
            throw new BadRequestException(`Kho chỉ còn ${item.product.stock}`);
        }
        item.quantity = quantity;
        return this.cartRepo.save(item);
    }
}
