import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { ProductsService } from './products.service';
  import { CreateProductDto } from './dto/create-product.dto';
  import { UpdateProductDto } from './dto/update-product.dto';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  
  // Bảo vệ toàn bộ controller: Yêu cầu login và phải là Admin
  @ApiTags('Products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/products') // Đặt prefix /admin
  export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}
  
    // Use Case: <<include>> Add Products
    @Post()
    create(@Body() createProductDto: CreateProductDto) {
      return this.productsService.create(createProductDto);
    }
  
    // Admin xem danh sách sản phẩm (hỗ trợ phân trang)
    @Get()
    findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
      return this.productsService.findAllPaginated(page, limit);
    }
  
    // Admin xem chi tiết 1 sản phẩm
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.productsService.findOne(+id);
    }
  
    // Use Case: <<include>> Edit Products
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
      return this.productsService.update(+id, updateProductDto);
    }
  
    // Use Case: <<include>> Delete Products
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.productsService.remove(+id);
    }
  }