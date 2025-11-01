import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  create(createServiceDto: CreateServiceDto): Promise<Service> {
    const newService = this.serviceRepository.create(createServiceDto);
    return this.serviceRepository.save(newService);
  }

  async findAllPaginated(page: number, limit: number) {
    const [data, total] = await this.serviceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOneBy({ id });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.serviceRepository.preload({
      id: id,
      ...updateServiceDto,
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return this.serviceRepository.save(service);
  }

  async remove(id: number): Promise<void> {
    // Lưu ý: Mặc định (ON DELETE SET NULL), khi xóa service,
    // các order_items.service_id và cart_items.service_id sẽ bị set về NULL.
    const result = await this.serviceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
  }
}