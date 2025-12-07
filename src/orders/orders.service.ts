import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus, DeliveryStatus } from './entities/order.entity';
import { DataSource, FindManyOptions, Repository } from 'typeorm';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { ShipperStatus } from 'src/shipper/entities/shipper-profile.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private notifService: NotificationsService
  ) {}
  //CUSTOMER METHOD
  //Tạo đơn hàng từ giỏ hàng
  async createOrderFromCart(userId: number) {
    //B1: Lấy giỏ hàng
    const cartItems = await this.cartRepository.find({
      where: {userId},
      relations: ['product', 'service']
    });
    if(cartItems.length === 0) {
      throw new BadRequestException("Giỏ hàng trống, không thể đặt hàng!");
    }
    //B2: Tính tổng tiền & kiểm tra kho lần cuối
    let totalAmount = 0;
    for(const item of cartItems) {
      if(item.product.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm "${item.product.stock}" không đủ hàng. (Còn: ${item.product.stock})`); 
      }
      let itemPrice = Number(item.product.price);
      if(item.service){
        itemPrice += Number(item.service.price);
      }
      totalAmount += itemPrice * item.quantity;
    }

    //B3: Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      //3.1: Tạo order
      const newOrder = queryRunner.manager.create(Order, {
        userId,
        total_amount: totalAmount,
        status: OrderStatus.PENDING
      });
      const savedOrder = await queryRunner.manager.save(newOrder);

      //3.2: Tạo OrderItems & Trừ kho
      for(const item of cartItems) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          price: item.product.price,
        });
        await queryRunner.manager.save(orderItem);

        await queryRunner.manager.decrement(Product, {id: item.productId}, 'stock', item.quantity);
      }
      //3.3: Xoá giỏ hàng
      await queryRunner.manager.delete(CartItem, {userId});

      //3.4: Lưu thay đổi
      await queryRunner.commitTransaction();
      await this.notifService.create({
        userId: userId,
        targetUserId: userId,
        orderId: savedOrder.id,
        type: 'Order',
        message: `You have successfully placed order #${savedOrder.id} with total ${savedOrder.total_amount.toLocaleString()}đ`,
      })
      const admins = await this.userRepository.find({where: {role: UserRole.ADMIN}});
      const customers = await this.userRepository.findOneBy({id: userId});
      for(const admin of admins) {
        await this.notifService.create({
          userId: admin.id,
          targetUserId: userId,
          orderId: savedOrder.id,
          type: 'New Order',
          message: `Customer ${customers?.full_name} has placed a new order #${savedOrder.id} worth ${savedOrder.total_amount.toLocaleString}đ`,
        })
      }
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }finally {
      await queryRunner.release();
    }
  }

  //Lấy danh sách đơn hàng
  async getMyOrders (userId: number) {
    return this.orderRepository.find({
      where: {userId},
      relations: ['orderItems', 'orderItems.product', 'orderItems.service'],
      order: {order_date: 'DESC'}
    })
  }

  //Xem chi tiết 1 đơn hàng
  async findOneCustomer(id: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: {id, userId},
      relations: ['orderItems', 'orderItems.product', 'orderItems.service', 'shipper'],
    });
    if(!order){
      throw new NotFoundException("Đơn hàng không tồn tại!");
    }
    return order;
  }
//ADMIN METHOD
  async findAllPaginated(page: number, limit: number, status?: string) {
  const whereOptions: FindManyOptions<Order>['where'] = {};
  if (status) {
    whereOptions.status = status as OrderStatus;
  }

  const [data, total] = await this.orderRepository.findAndCount({
    where: whereOptions,
    relations: ['user', 'shipper'], 
    skip: (page - 1) * limit,
    take: limit,
    order: { id: 'ASC' },
  });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user', 
        'orderItems', 
        'orderItems.product', 
        'orderItems.service', 
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    order.status = status;
    return this.orderRepository.save(order);
  }

  async assignShipper(orderId: number, shipperId: number) {
    // 1. Tìm đơn hàng
    const order = await this.orderRepository.findOne({where: {id: orderId},relations: ['user'] });
    if (!order) throw new NotFoundException('Order not found');
    // 2. Tìm Shipper và kiểm tra trạng thái
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperProfile'] 
    });
    if (!shipper) throw new NotFoundException('Shipper not found');
    // Kiểm tra xem có phải shipper không
    if (shipper.role !== 'shipper') {
        throw new BadRequestException('User is not a shipper');
    }
    // 3. Kiểm tra trạng thái hoạt động
    const status = shipper.shipperProfile?.status;
    if (status !== ShipperStatus.AVAILABLE) {
        throw new BadRequestException(`Shipper này đang không sẵn sàng (Trạng thái: ${status})`);
    }
    // 4. Gán đơn (Nếu hợp lệ)
    order.shipperId = shipperId;
    order.deliveryStatus = DeliveryStatus.ASSIGNED;
    order.status = OrderStatus.SHIPPED;
    const savedOrder = await this.orderRepository.save(order);
    await this.notifService.create({
      userId: shipperId,
      targetUserId: shipperId,
      orderId: savedOrder.id,
      type: 'New Shipment',
      message: `Bạn được phân công giao đơn hàng #${savedOrder.id}. Vui lòng kiểm tra danh sách đơn giao.`,
    });
    if(order.user) {
      await this.notifService.create({
        userId: order.user.id,
        targetUserId: shipperId,
        orderId: savedOrder.id,
        type: 'Order Update',
        message: `Đơn hàng #${savedOrder.id} đã được bàn giao cho Shipper: ${shipper.full_name} - SĐT ${shipper.phone}.`,
      })
    }
    return savedOrder;
  }
//SHIPPER METHOD
  async updateDeliveryStatus(orderId: number, shipperId: number, status: DeliveryStatus) {
    const order = await this.orderRepository.findOne({where: {id: orderId}, relations: ['user', 'shipper']});
    if(!order) {
      throw new NotFoundException("Order Not Found");
    }
    if(order.shipperId !== shipperId) {
      throw new BadRequestException("You are not the shipper for this order");
    }
    order.deliveryStatus = status;
    if(status === DeliveryStatus.PICKED_UP) {
      order.status = OrderStatus.SHIPPED;
      order.pickupTime = new Date();
    }else if(status === DeliveryStatus.DELIVERED) {
      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();
    }
    const savedOrder = await this.orderRepository.save(order);
    if(order.user) {
      let message = `Đơn hàng #${order.id} cập nhật trạng thái: ${status}.`;
      if(status === DeliveryStatus.PICKED_UP || status === DeliveryStatus.IN_TRANSIT) {
        message =`Shipper ${order.shipper?.full_name} (SDT: ${order.shipper?.phone}) đang giao đơn hàng #${order.id} cho bạn.`;
      } else if(status === DeliveryStatus.DELIVERED) {
        message = `Đơn hàng #${order.id} đã được giao thành công! Cảm ơn bạn đã mua hàng.`;
      }
      await this.notifService.create({
        userId: order.user.id,
        targetUserId: shipperId,
        orderId: order.id,
        type: 'Order Status',
        message: message,
      });
    }
    return savedOrder;
  }
  async getMyShipments(shipperId: number) {
    return this.orderRepository.find({
      where: {shipperId},
      relations: ['user'],
      order: {order_date: 'DESC'}
    });
  }
}