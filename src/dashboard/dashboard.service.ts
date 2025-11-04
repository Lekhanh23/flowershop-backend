// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { Product, ProductStatus } from 'src/products/entities/product.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { LessThan, MoreThan, Repository, SelectQueryBuilder } from 'typeorm';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Review } from 'src/reviews/entities/review.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async getStats() {
    // --- 1. Dành cho 4 ô thống kê ---

    // Tổng doanh thu (chỉ tính đơn đã giao)
    const totalRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total_amount)', 'total')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();
    const totalRevenue = totalRevenueResult.total || 0;

    // Tổng số đơn hàng (tất cả trạng thái)
    const totalOrders = await this.orderRepository.count();

    // Tổng số sản phẩm
    const totalProducts = await this.productRepository.count();

    // Cảnh báo sắp hết hàng (ví dụ: < 5 sản phẩm)
    const lowStockProducts = await this.productRepository.count({
      where: { stock: LessThan(5), status: ProductStatus.IN_STOCK }, // <-- Sửa thành enum
    });

    // --- 2. Dành cho 4 biểu đồ ---

    // Biểu đồ 1: Sales Report (Doanh thu theo ngày, 7 ngày qua)
    const salesReport = await this.orderRepository
      .createQueryBuilder('order')
      .select("DATE(order.order_date)", 'date')
      .addSelect('SUM(order.total_amount)', 'Sales')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('order.order_date >= CURDATE() - INTERVAL 7 DAY')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Biểu đồ 2: Best-selling Products (Top 3)
    const bestSellingProducts = await this.orderItemRepository
      .createQueryBuilder('item')
      .select('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'sold')
      .leftJoin('item.product', 'product')
      .groupBy('product.name')
      .orderBy('sold', 'DESC')
      .limit(3)
      .getRawMany();

    // Biểu đồ 3: Order Status Distribution
    const orderStatusDistribution = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'name')
      .addSelect('COUNT(order.id)', 'value')
      .groupBy('order.status')
      .getRawMany();

    // Biểu đồ 4: Average Rating per Product (Top 3 sản phẩm được đánh giá)
    const averageRatingPerProduct = await this.reviewRepository
      .createQueryBuilder('review')
      .select('product.name', 'name')
      .addSelect('AVG(review.rating)', 'rating')
      .leftJoin('review.product', 'product')
      .groupBy('product.name')
      .orderBy('rating', 'DESC')
      .limit(3)
      .getRawMany();

    return {
      // 4 ô thống kê
      totalRevenue: Number(totalRevenue),
      totalProducts,
      totalOrders,
      lowStockProducts,
      
      // 4 biểu đồ
      salesReport,
      bestSellingProducts: bestSellingProducts.map(p => ({ ...p, sold: Number(p.sold) })), // Đảm bảo 'sold' là số
      orderStatusDistribution: orderStatusDistribution.map(s => ({ ...s, value: Number(s.value) })), // Đảm bảo 'value' là số
      averageRatingPerProduct: averageRatingPerProduct.map(p => ({ ...p, rating: Number(p.rating).toFixed(1) })), // Format rating
    };
  }
}