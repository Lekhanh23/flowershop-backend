import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
  } from 'typeorm';
  import { Review } from './review.entity';
  
  @Entity('review_images')
  export class ReviewImage {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ name: 'review_id' })
    review_id: number;
  
    @ManyToOne(() => Review, (review) => review.reviewImages)
    @JoinColumn({ name: 'review_id' })
    review: Review;
  
    @Column({ length: 255 })
    image_path: string;
  
    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;
  }