import { Order } from 'src/orders/entities/order.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  OneToOne,
} from 'typeorm';
import { ShipperProfile } from 'src/shipper/entities/shipper-profile.entity';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  SHIPPER = 'shipper',
}

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  full_name: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 255, unique: true }) 
  password: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
  
  @OneToMany(() => CartItem, (cartItem) => cartItem.user) 
  cartItems: CartItem[];

  @OneToOne(() => ShipperProfile, (profile) => profile.user)
  shipperProfile: ShipperProfile;
}