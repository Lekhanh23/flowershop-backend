import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
}

export enum DeliveryStatus {
  UNASSIGNED = 'unassigned',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @CreateDateColumn({ name: 'order_date' })
  order_date: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({name: 'shipper_id', nullable: true})
  shipperId: number;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.UNASSIGNED,
    name: 'delivery_status'
  })
  deliveryStatus: DeliveryStatus;

  @Column({name: 'pickup_time', nullable: true})
  pickupTime: Date;

  @Column({name: 'delivered_at', nullable: true})
  deliveredAt: Date;

  @Column({name: 'tracking_code', nullable: true})
  trackingCode: string;

  @OneToMany(() => OrderItem, (item) => item.order, {cascade: true})
  orderItems: OrderItem[];

  @ManyToOne(() => User)
  @JoinColumn({name: 'shipper_id'})
  shipper: User;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;
}