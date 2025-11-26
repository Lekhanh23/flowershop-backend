import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({example: 'Đào Lê Khanh', description: 'Họ và tên'})
    @IsString()
    @IsNotEmpty()
    full_name: string;

    @ApiProperty({example: 'lekhanh@gmail.com', description: 'Email'})
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({example: '123456', description: 'Mật khẩu'})
    @IsString()
    @IsNotEmpty()
    @MinLength(6, {message: 'Password must be at least 6 characters long'})
    password: string;

    @ApiPropertyOptional({example: '0913144768', description: 'Số điện thoại'})
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({example: '123 Đường A, Hà Nội', description: 'Địa chỉ'})
    @IsString()
    @IsOptional()
    address?: string;
}