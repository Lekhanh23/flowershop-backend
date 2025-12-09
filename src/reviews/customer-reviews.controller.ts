import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Reviews (Customer)')
@ApiBearerAuth()
@Controller('reviews') 
@UseGuards(JwtAuthGuard) 
export class CustomerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }
}