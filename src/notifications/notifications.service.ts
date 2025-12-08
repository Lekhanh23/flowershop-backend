import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>) {
    const newNotif = this.notifRepo.create(data);
    return this.notifRepo.save(newNotif);
  }

  async findAllPaginated(page: number, limit: number) {
    const [data, total] = await this.notifRepo.findAndCount({
      relations: ['user', 'targetUser', 'product', 'order'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
      select: ['id', 'type', 'message', 'createdAt', 'userId']
    });
    return { data, total, page, limit };
  }

  async remove(id: number) {
    const result = await this.notifRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
  }

  async findByUser(userId: number, page: number, limit: number) {
    const [data, total] = await this.notifRepo.findAndCount({
        where: { targetUserId: userId },
        order: { createdAt: 'DESC' }, 
        skip: (page - 1) * limit,
        take: limit,
    });
    return { data, total, page, limit };
  }
}