import { Collection } from 'src/collections/entities/collection.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { CartItem } from 'src/cart-items/entities/cart-item.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

export enum ProductStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 255, nullable: true })
  image: string;

  @Column({ name: 'collection_id', nullable: true })
  collection_id: number;

  @ManyToOne(() => Collection, (collection) => collection.products)
  @JoinColumn({ name: 'collection_id' })
  collection: Collection;

  @Column({ default: 0 })
  stock: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.IN_STOCK,
  })
  status: ProductStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product) 
  cartItems: CartItem[];
}