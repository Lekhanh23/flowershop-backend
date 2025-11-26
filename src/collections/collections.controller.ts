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
  import { CollectionsService } from './collections.service';
  import { CreateCollectionDto } from './dto/create-collection.dto';
  import { UpdateCollectionDto } from './dto/update-collection.dto';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  
  @ApiTags('Collections')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/collections')
  export class CollectionsController {
    constructor(private readonly collectionsService: CollectionsService) {}
  
    // Admin tạo bộ sưu tập mới
    @Post()
    create(@Body() createCollectionDto: CreateCollectionDto) {
      return this.collectionsService.create(createCollectionDto);
    }
  
    // Admin xem danh sách bộ sưu tập (có phân trang)
    @Get()
    findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
      return this.collectionsService.findAllPaginated(page, limit);
    }
  
    // Admin xem chi tiết 1 bộ sưu tập
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.collectionsService.findOne(+id);
    }
  
    // Admin cập nhật bộ sưu tập
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() updateCollectionDto: UpdateCollectionDto,
    ) {
      return this.collectionsService.update(+id, updateCollectionDto);
    }
  
    // Admin xóa bộ sưu tập
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.collectionsService.remove(+id);
    }
  }