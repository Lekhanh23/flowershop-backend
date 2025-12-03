import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
  ) {}

  create(createCollectionDto: CreateCollectionDto): Promise<Collection> {
    const newCollection = this.collectionRepository.create(createCollectionDto);
    return this.collectionRepository.save(newCollection);
  }

  async findAllPaginated(page: number, limit: number) {
    const [data, total] = await this.collectionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ['products'], // Lấy các sản phẩm thuộc bộ sưu tập này
    });
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    return collection;
  }

  async update(
    id: number,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<Collection> {
    const collection = await this.collectionRepository.preload({
      id: id,
      ...updateCollectionDto,
    });
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    return this.collectionRepository.save(collection);
  }

  async remove(id: number): Promise<void> {
    const result = await this.collectionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
  }

  async findAllPublic(){
    return this.collectionRepository.find({
      take: 12,
      order: {id: 'ASC'},
    })
  }
}