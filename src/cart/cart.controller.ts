import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
    constructor (private readonly cartService : CartService) {}
    @Get()
    getMyCart(@GetUser() user : User) {
        return this.cartService.getMyCart(user.id);
    }

    @Post()
    addToCart(@GetUser() user : User, @Body() dto: AddToCartDto) {
        return this.cartService.addToCart(user.id, dto);
    }

    @Delete(':id')
    removeFromCart(@GetUser() user : User, @Param('id', ParseIntPipe) id: number) {
        return this.cartService.removeFromCart(user.id, id);
    }

    @Patch(':id')
    updateQuantity(@GetUser() user : User, @Param('id', ParseIntPipe) id: number, @Body('quantity') quantity: number) {
        return this.cartService.updateQuantity(user.id, id, quantity);
    }
}
