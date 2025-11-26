import {
    Controller,
    Get,
    Param,
    Delete,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { ReviewsService } from './reviews.service';
  import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard';
  import { Roles } from 'src/auth/decorators/roles.decorator';
  import { UserRole } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  
  @ApiTags('Reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Controller('admin/reviews')
  export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}
  
    // Use Case: Manage Reviews (View List)
    @Get()
    findAll(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.reviewsService.findAllPaginated(page, limit);
    }
  
    // Use Case: Manage Reviews (Delete)
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.reviewsService.remove(+id);
    }
  }