import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsEnum,
    Min,
    IsInt,
  } from 'class-validator';
  import { ProductStatus } from '../entities/product.entity';
  
  export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsOptional()
    description: string;
  
    @IsNumber()
    @Min(0)
    price: number;
  
    @IsString()
    @IsOptional()
    image: string; // Tạm thời là string, có thể nâng cấp lên file upload
  
    @IsInt()
    @IsOptional()
    collection_id: number;
  
    @IsInt()
    @Min(0)
    stock: number;
  
    @IsEnum(ProductStatus)
    @IsOptional()
    status: ProductStatus;
  }