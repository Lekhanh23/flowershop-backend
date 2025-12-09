import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { CustomerReviewsController } from './customer-reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewImage])],
  controllers: [ReviewsController, CustomerReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}