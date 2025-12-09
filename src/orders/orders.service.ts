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

  // CUSTOMER: TẠO ĐƠN HÀNG
  async createOrderFromCart(userId: number) {
    const cartItems = await this.cartRepository.find({
      where: {userId},
      relations: ['product', 'service']
    });
    if(cartItems.length === 0) {
      throw new BadRequestException("Giỏ hàng trống, không thể đặt hàng!");
    }
    
    let totalAmount = 0;
    for(const item of cartItems) {
      if(item.product.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm "${item.product.name}" không đủ hàng.`); 
      }
      let itemPrice = Number(item.product.price);
      if(item.service){
        itemPrice += Number(item.service.price);
      }
      totalAmount += itemPrice * item.quantity;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newOrder = queryRunner.manager.create(Order, {
        userId,
        total_amount: totalAmount,
        status: OrderStatus.PENDING
      });
      const savedOrder = await queryRunner.manager.save(newOrder);

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
      
      await queryRunner.manager.delete(CartItem, {userId});
      await queryRunner.commitTransaction();

      // 'order_status' 
      await this.notifService.create({
        userId: userId,
        targetUserId: userId,
        orderId: savedOrder.id,
        type: 'order_status', 
        message: `Đặt hàng thành công #${savedOrder.id}. Tổng tiền: ${savedOrder.total_amount.toLocaleString()}đ`,
      })

      const admins = await this.userRepository.find({where: {role: UserRole.ADMIN}});
      const customers = await this.userRepository.findOneBy({id: userId});
      for(const admin of admins) {
        // 'admin_message' 
        await this.notifService.create({
          userId: admin.id,
          targetUserId: userId,
          orderId: savedOrder.id,
          type: 'admin_message',
          message: `Khách hàng ${customers?.full_name} vừa đặt đơn mới #${savedOrder.id}`,
        })
      }
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ADMIN: GÁN SHIPPER
  async assignShipper(orderId: number, shipperId: number) {
    const order = await this.orderRepository.findOne({where: {id: orderId},relations: ['user'] });
    if (!order) throw new NotFoundException('Order not found');
    
    const shipper = await this.userRepository.findOne({
      where: { id: shipperId },
      relations: ['shipperProfile'] 
    });
    if (!shipper) throw new NotFoundException('Shipper not found');
    
    if (shipper.role !== 'shipper') {
        throw new BadRequestException('User is not a shipper');
    }
    
    const status = shipper.shipperProfile?.status;
    if (status !== ShipperStatus.AVAILABLE) {
        throw new BadRequestException(`Shipper này đang bận (Trạng thái: ${status})`);
    }
    
    order.shipperId = shipperId;
    order.deliveryStatus = DeliveryStatus.ASSIGNED;
    order.status = OrderStatus.SHIPPED;
    const savedOrder = await this.orderRepository.save(order);

    await this.notifService.create({
      userId: shipperId,
      targetUserId: shipperId,
      orderId: savedOrder.id,
      type: 'shipper_assignment',
      message: `Bạn được phân công giao đơn #${savedOrder.id}.`,
    });

    if(order.user) {
      await this.notifService.create({
        userId: order.user.id,
        targetUserId: shipperId,
        orderId: savedOrder.id,
        type: 'order_status',
        message: `Đơn hàng #${savedOrder.id} đã được giao cho Shipper ${shipper.full_name}.`,
      })
    }
    return savedOrder;
  }

  // SHIPPER: CẬP NHẬT TIẾN ĐỘ
  async updateDeliveryStatus(orderId: number, shipperId: number, status: DeliveryStatus) {
    const order = await this.orderRepository.findOne({where: {id: orderId}, relations: ['user', 'shipper']});
    if(!order) throw new NotFoundException("Order Not Found");
    
    if(order.shipperId !== shipperId) {
      throw new BadRequestException("Bạn không phải shipper của đơn này");
    }
    
    order.deliveryStatus = status;
    if(status === DeliveryStatus.PICKED_UP) {
      order.status = OrderStatus.SHIPPED;
      order.pickupTime = new Date();
    } else if(status === DeliveryStatus.DELIVERED) {
      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();
    }
    const savedOrder = await this.orderRepository.save(order);
    
    if(order.user) {
      let message = `Đơn hàng #${order.id} cập nhật trạng thái: ${status}.`;
      if(status === DeliveryStatus.DELIVERED) {
        message = `Đơn hàng #${order.id} đã giao thành công! Cảm ơn bạn.`;
      }
      
      await this.notifService.create({
        userId: order.user.id,
        targetUserId: shipperId,
        orderId: order.id,
        type: 'order_status',
        message: message,
      });
    }
    return savedOrder;
  }

  // CÁC HÀM GET DỮ LIỆU
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

  async getMyShipments(shipperId: number) {
    return this.orderRepository.find({
      where: {shipperId},
      relations: ['user'],
      order: {order_date: 'DESC'}
    });
  }

  async getMyOrders (userId: number) { 
    return this.orderRepository.find({
      where: {userId}, 
      relations: ['orderItems', 'orderItems.product', 'orderItems.service'], 
      order: {order_date: 'DESC'}
    }) 
  }
  
  async findOneCustomer(id: number, userId: number) { 
    return this.orderRepository.findOne({
      where: {id, userId}, 
      relations: ['orderItems', 'orderItems.product', 'orderItems.service', 'shipper']
    }) 
  }

  async findOne(id: number) { 
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'orderItems', 'orderItems.product', 'orderItems.service'],
    });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async updateStatus(id: number, status: OrderStatus) { 
    const order = await this.orderRepository.findOneBy({ id }); 
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`); 
    order.status = status; 
    return this.orderRepository.save(order); 
  }
}