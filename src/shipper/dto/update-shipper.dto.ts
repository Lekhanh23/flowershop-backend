import { IsEnum, IsOptional, IsString } from "class-validator";
import { ShipperStatus } from "../entities/shipper-profile.entity";

export class UpdateShipperStatusDto{
    @IsEnum(ShipperStatus)
    status: ShipperStatus;
}

export class UpdateShipperProfileDto{
    @IsOptional() @IsString() phone?: string;
}