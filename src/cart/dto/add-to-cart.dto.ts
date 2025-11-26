import { IsInt, Min, IsOptional } from "class-validator";

export class AddToCartDto {
    @IsInt()
    productId: number;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsInt()
    @IsOptional()
    serviceId?: number;
}