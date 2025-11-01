import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
  } from 'class-validator';
  
  export class CreateServiceDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsNumber()
    @Min(0)
    price: number;
  
    @IsString()
    @IsOptional()
    description: string;
  }