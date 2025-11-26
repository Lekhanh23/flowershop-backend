import { IsEnum, IsString, IsOptional } from "class-validator";
import { ApplicationStatus } from "../entities/shipper-application.entity";

export class ReviewApplicationDto {
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus

    @IsString()
    @IsOptional()
    adminNote?: string;
}