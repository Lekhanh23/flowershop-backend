import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CartItem } from 'src/cart/entities/cart-item.entity';
@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;
  
  // Bạn có thể thêm relation cho cart_items nếu cần
  @OneToMany(() => OrderItem, (item) => item.service)
  orderItems: OrderItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.service) // <-- Thêm dòng này
  cartItems: CartItem[];
}