import {
    Controller,
    Get,
    Body,
    Patch,
    Param,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole } from 'src/users/entities/user.entity';
  import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/orders')
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}
  
    // Use Case: Manage Orders (View List)
    @Get()
    findAll(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('status') status: string,
    ) {
      return this.ordersService.findAllPaginated(page, limit, status);
    }
  
    // Use Case: Manage Orders (View Detail)
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.ordersService.findOne(+id);
    }
  
    // Use Case: Manage Orders (Update Status)
    @Patch(':id/status')
    updateStatus(
      @Param('id') id: string,
      @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    ) {
      return this.ordersService.updateStatus(+id, updateOrderStatusDto.status);
    }
  }