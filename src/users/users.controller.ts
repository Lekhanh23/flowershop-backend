import {
  Controller, Get, Param, Delete, UseGuards, Query, Patch, Body, Request
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto'; 

@ApiTags('User')
@ApiBearerAuth()
@Controller('users') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- CÁC API DÀNH CHO ADMIN  ---
  
  @Get('admin/list') // Admin xem danh sách
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  findAll(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('role') role?: UserRole,
  ) {
      return this.usersService.findAll(page, limit, role);
  }

  @Get('admin/:id') // Admin xem chi tiết khách
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOneCustomer(@Param('id') id: string) {
      return this.usersService.findOneCustomer(+id);
  }

  @Delete('admin/:id') // Admin xóa user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
      return this.usersService.remove(+id);
  }

  @Patch('admin/:id') // Admin sửa user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
      return this.usersService.update(+id, body);
  }

  // --- CÁC API CÁ NHÂN (PROFILE)  ---

  @UseGuards(JwtAuthGuard) 
  @Get('profile') // => /api/users/profile
  getProfile(@Request() req) {
      return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile') // => /api/users/profile
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
      return this.usersService.update(req.user.id, updateUserDto);
  }
}