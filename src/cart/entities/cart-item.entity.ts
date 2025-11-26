import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Product } from "src/products/entities/product.entity";
import { Service } from "src/services/entities/service.entity";

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'user_id'})
    userId: number;

    @Column({name: 'product_id'})
    productId: number;

    @Column({default: 1})
    quantity: number;

    @Column({name: 'service_id', nullable: true})
    serviceId: number;

    @ManyToOne(() => User, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User;

    @ManyToOne(() => Product, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'product_id'})
    product: Product;

    @ManyToOne(() => Service, {onDelete: 'SET NULL', nullable: true})
    @JoinColumn({name: 'service_id'})
    service: Service;
}