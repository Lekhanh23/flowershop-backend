import { Product } from 'src/products/entities/product.entity';
import { Service } from 'src/services/entities/service.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'service_id', nullable: true })
  serviceId: number;

  @ManyToOne(() => Service, {nullable: true})
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Order, (order) => order.orderItems, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}