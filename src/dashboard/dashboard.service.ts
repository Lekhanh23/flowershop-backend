import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getStats() {
    const totalRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total_amount)', 'total')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();
    
    const totalRevenue = totalRevenueResult.total || 0;

    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
    });

    const totalCustomers = await this.userRepository.count({
      where: { role: UserRole.CUSTOMER },
    });

    const lowStockProducts = await this.productRepository.count({
      where: { stock: LessThan(5) }, // Giả sử sắp hết hàng là < 5
    });

    return {
      totalRevenue,
      pendingOrders,
      totalCustomers,
      lowStockProducts,
    };
  }
}