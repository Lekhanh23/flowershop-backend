import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { FindManyOptions, Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async findAllPaginated(page: number, limit: number, status?: string) {
    const whereOptions: FindManyOptions<Order>['where'] = {};
    if (status) {
      whereOptions.status = status as OrderStatus;
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where: whereOptions,
      relations: ['user'], // Lấy thông tin user
      skip: (page - 1) * limit,
      take: limit,
      order: { order_date: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user', // Thông tin người đặt
        'orderItems', // Các sản phẩm trong đơn
        'orderItems.product', // Chi tiết sản phẩm
        'orderItems.service', // Chi tiết dịch vụ
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    order.status = status;
    return this.orderRepository.save(order);
  }
}