import { Module } from '@nestjs/common';
import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipperApplication } from './entities/shipper-application.entity';
import { ShipperProfile } from './entities/shipper-profile.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShipperApplication, ShipperProfile, User, Order]), 
    NotificationsModule
  ],
  controllers: [ShipperController],
  providers: [ShipperService],
  exports: [ShipperService]
})
export class ShipperModule {}