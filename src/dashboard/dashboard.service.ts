import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Collection } from "src/collections/entities/collection.entity";
import { OrderItem } from "src/orders/entities/order-item.entity";
import { Order, OrderStatus } from "src/orders/entities/order.entity";
import { Product } from "src/products/entities/product.entity";
import { Review } from "src/reviews/entities/review.entity";
import { Repository } from "typeorm";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Collection) private collectionRepo: Repository<Collection>
  ) {}
  async getDashboardStats() {
    //Phần 1: TOP CARDS
    //1. Total Revenue (Chỉ tính đơn đã Shipped hoặc Delivered để chắc chắn có tiền)
    const revenueResult = await this.orderRepo.createQueryBuilder('order')
    .select('SUM(order.total_amount)', 'total')
    .where('order.status IN (:...statuses)', {statuses: [OrderStatus.SHIPPED, OrderStatus.DELIVERED]})
    .getRawOne();
    const totalRevenue = Number(revenueResult.total) || 0;

    //2. Number of Products
    const totalProducts = await this.productRepo.count();

    //3. Total Orders
    const totalOrders = await this.orderRepo.count();

    //4. Low-Stocks Alerts
    const lowStockCount = await this.productRepo.createQueryBuilder('product')
    .where('product.stock < :threshold', {threshold: 5}).getCount();

    //5. Number of Collections
    const totalCollections = await this.collectionRepo.count();

    //Phần 2: CHARTS
    //Chart 1: SALE REPORT
    const salesReport = await this.orderRepo.createQueryBuilder('order')
    .select("DATE_FORMAT(order.order_date, '%Y-%m-%d')", 'date')
    .addSelect('SUM(order.total_amount)', 'total').groupBy('date').orderBy('date', 'ASC')
    .limit(7).getRawMany();

    //Chart 2: Best-selling Products
    const bestSellingProducts = await this.orderItemRepo.createQueryBuilder('oi')
    .leftJoin('oi.product', 'p').select('p.name', 'name')
    .addSelect('SUM(oi.quantity)', 'sold_quantity').groupBy('p.id')
    .orderBy('sold_quantity', 'DESC').limit(3).getRawMany();

    //Chart 3: Order Status Distribution
    const orderStatusDist = await this.orderRepo.createQueryBuilder('order')
    .select('order.status', 'status').addSelect('COUNT(order.id)', 'count')
    .groupBy('order.status').getRawMany();

    //Chart 4: Average Rating per Product
    const topRatedProducts = await this.reviewRepo.createQueryBuilder('review')
    .leftJoin('review.product', 'p').select('p.name', 'name')
    .addSelect('AVG(review.rating)', 'avg_rating').groupBy('p.id').orderBy('avg_rating', 'DESC')
    .limit(5).getRawMany();

    return {
      cards: {
        totalRevenue,
        totalProducts,
        totalCollections,
        totalOrders,
        lowStockCount
      },
      charts: {
        salesReport,
        bestSellingProducts,
        orderStatusDist,
        topRatedProducts,
      }
    };
  }
  
}