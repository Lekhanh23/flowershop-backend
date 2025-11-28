import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { CollectionsModule } from './collections/collections.module';
import { ServicesModule } from './services/services.module';
import { ShipperModule } from './shipper/shipper.module';
import { CartModule } from './cart/cart.module';
// Import tất cả các Entities của bạn
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Collection } from './collections/entities/collection.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Review } from './reviews/entities/review.entity';
import { ReviewImage } from './reviews/entities/review-image.entity';
import { Service } from './services/entities/service.entity';
import { CartItem } from './cart/entities/cart-item.entity'; 
import { UploadModule } from './upload/upload.module';
import { ShipperApplication } from './shipper/entities/shipper-application.entity';
import { ShipperProfile } from './shipper/entities/shipper-profile.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
        username: configService.get<string>('DB_USER')!,
        password: configService.get<string>('DB_PASS')!,
        database: configService.get<string>('DB_NAME')!,
        entities: [
          User,
          Product,
          Collection,
          Order,
          OrderItem,
          Review,
          ReviewImage,
          Service,
          CartItem,
          ShipperApplication,
          ShipperProfile,
          Notification
        ],
        synchronize: false, // Để false vì chúng ta đã có schema từ file .sql
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    ReviewsModule,
    CollectionsModule,
    ServicesModule,
    DashboardModule,
    ShipperModule,
    CartModule,
    UploadModule,
    NotificationsModule
  ],
})
export class AppModule {}