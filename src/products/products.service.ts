import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Collection } from 'src/collections/entities/collection.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { collection_id, ...rest } = createProductDto;
    const newProduct = this.productRepository.create(rest);

    if (collection_id) {
      const collection = await this.collectionRepository.findOneBy({
        id: collection_id,
      });
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${collection_id} not found`);
      }
      newProduct.collection = collection;
    }

    return this.productRepository.save(newProduct);
  }

  async findAllPaginated(page: number, limit: number) {
    const [data, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['collection'], // Lấy thông tin collection
    });
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['collection'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id); // Kiểm tra tồn tại
    
    const { collection_id, ...rest } = updateProductDto;
    
    // Cập nhật các trường thông thường
    this.productRepository.merge(product, rest);

    // Cập nhật collection nếu có
    if (collection_id) {
       const collection = await this.collectionRepository.findOneBy({
        id: collection_id,
      });
      if (!collection) {
        throw new NotFoundException(`Collection with ID ${collection_id} not found`);
      }
      product.collection = collection;
    }

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}