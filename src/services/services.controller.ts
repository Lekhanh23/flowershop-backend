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
  import { ServicesService } from './services.service';
  import { CreateServiceDto } from './dto/create-service.dto';
  import { UpdateServiceDto } from './dto/update-service.dto';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  
  @ApiTags('Services')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/services')
  export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}
  
    // Admin tạo dịch vụ mới
    @Post()
    create(@Body() createServiceDto: CreateServiceDto) {
      return this.servicesService.create(createServiceDto);
    }
  
    // Admin xem danh sách dịch vụ (có phân trang)
    @Get()
    findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
      return this.servicesService.findAllPaginated(page, limit);
    }
  
    // Admin xem chi tiết 1 dịch vụ
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.servicesService.findOne(+id);
    }
  
    // Admin cập nhật dịch vụ
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() updateServiceDto: UpdateServiceDto,
    ) {
      return this.servicesService.update(+id, updateServiceDto);
    }
  
    // Admin xóa dịch vụ
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.servicesService.remove(+id);
    }
  }