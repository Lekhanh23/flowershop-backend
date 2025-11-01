import { Product } from 'src/products/entities/product.entity';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.cartItems) // Giả sử bạn thêm cartItems: CartItem[] vào User entity
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'product_id' })
  product_id: number;

  @ManyToOne(() => Product, (product) => product.cartItems) // Giả sử bạn thêm cartItems: CartItem[] vào Product entity
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ default: 1 })
  quantity: number;

  @Column({ name: 'service_id', nullable: true })
  service_id: number;

  @ManyToOne(() => Service, (service) => service.cartItems) // Giả sử bạn thêm cartItems: CartItem[] vào Service entity
  @JoinColumn({ name: 'service_id' })
  service: Service;
}