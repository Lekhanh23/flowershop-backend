import { Module } from '@nestjs/common';
import { ShipperController } from './shipper.controller';
import { ShipperService } from './shipper.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipperApplication } from './entities/shipper-application.entity';
import { ShipperProfile } from './entities/shipper-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShipperApplication, ShipperProfile])],
  controllers: [ShipperController],
  providers: [ShipperService],
  exports: [ShipperService]
})
export class ShipperModule {}
