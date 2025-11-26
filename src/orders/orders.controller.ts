import {
    Controller,
    Get,
    Body,
    Patch,
    Param,
    UseGuards,
    Query,
    ParseIntPipe,
    Post,
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { User, UserRole } from 'src/users/entities/user.entity';
  import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
  import { GetUser } from 'src/auth/decorators/get-user.decorator';
  import { DeliveryStatus } from './entities/order.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  
  @ApiTags('Orders')
  @ApiBearerAuth()
  @Controller('orders')
  @UseGuards(JwtAuthGuard)
  export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}
  //CUSTOMER METHOD
  //Tạo đơn từ giỏ hàng
  @Post()
  create(@GetUser() user : User) {
    return this.ordersService.createOrderFromCart(user.id);
  }

  //Xem lịch sử đơn hàng
  @Get('my-orders')
  findMyOrders(@GetUser() user : User) {
    return this.ordersService.getMyOrders(user.id);
  }

  //Xem chi tiết đơn hàng
  @Get('my-orders/:id')
  findOneMyOrder(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user : User,
  ) {
    return this.ordersService.findOneCustomer(id, user.id);
  }

  //ADMIN METHOD
  //Xem tất cả đơn hàng (phân trang)
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAllPaginated(page, limit, status);
  }

  //Xem chi tiết bất kỳ đơn nào (theo ID)
  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOneByAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  //Cập nhật trạng thái đơn hàng
  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto : UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }

  //SHIPPER METHOD
  //Xem danh sách đơn được giao
  @Get('shipper/my-shipments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHIPPER)
  getMyShipments(@GetUser() shipper: User) {
    return this.ordersService.getMyShipments(shipper.id);
  }

  //Cập nhật tiến độ giao hàng
  @Patch('shipper/:id/delivery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SHIPPER)
  updateDeliveryStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser()shipper: User,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.ordersService.updateDeliveryStatus(id, shipper.id, status);
  }
  }