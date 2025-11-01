import {
    Controller,
    Get,
    Param,
    Delete,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole } from './entities/user.entity';
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    // Use Case: Manage Customer Accounts (View List)
    @Get()
    findAllCustomers(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.usersService.findAllCustomers(page, limit);
    }
  
    // Use Case: Manage Customer Accounts (View Detail)
    @Get(':id')
    findOneCustomer(@Param('id') id: string) {
      return this.usersService.findOneCustomer(+id);
    }
  
    // Use Case: Manage Customer Accounts (Delete)
    @Delete(':id')
    removeCustomer(@Param('id') id: string) {
      return this.usersService.removeCustomer(+id);
    }
  }