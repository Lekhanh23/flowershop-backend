import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async findAllPaginated(page: number, limit: number) {
    const [data, total] = await this.reviewRepository.findAndCount({
      relations: ['user', 'product', 'reviewImages'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total, page, limit };
  }

  async remove(id: number): Promise<void> {
    // Xóa review sẽ tự động xóa review_images (nhờ ON DELETE CASCADE)
    const result = await this.reviewRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
  }

  async create(userId: number, dto: CreateReviewDto) {
    const newReview = this.reviewRepository.create({
      user_id: userId,
      product_id: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
    });
    
    return this.reviewRepository.save(newReview);
  }
}