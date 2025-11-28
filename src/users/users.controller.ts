import {
    Controller,
    Get,
    Param,
    Delete,
    UseGuards,
    Query,
    Patch,
    Body
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole, User } from './entities/user.entity';
  import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
  
  @ApiTags('User')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
  @ApiQuery({ name: 'role', enum: UserRole, required: false })// Hiển thị trên Swagger
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: UserRole, // Nhận tham số role
  ) {
    return this.usersService.findAll(page, limit, role);
  }

    // Use Case: Manage Customer Accounts (View List)
    @Get()
    findAllCustomers(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.usersService.findAll(page, limit);
    }
  
    // Use Case: Manage Customer Accounts (View Detail)
    @Get(':id')
    findOneCustomer(@Param('id') id: string) {
      return this.usersService.findOneCustomer(+id);
    }
  
    // Use Case: Manage User Accounts (Delete)
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.usersService.remove(+id);
    }

    // Use Case: Update Customer Info
    @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(+id, body);
  }
  }