import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // *** Dành cho Admin ***

  async findAllCustomers(page: number, limit: number) {
    const [data, total] = await this.userRepository.findAndCount({
      where: { role: UserRole.CUSTOMER },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOneCustomer(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.CUSTOMER },
      relations: ['orders'], // Lấy lịch sử đơn hàng
    });
    if (!user) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return user;
  }

  async removeCustomer(id: number): Promise<void> {
    const result = await this.userRepository.delete({
      id,
      role: UserRole.CUSTOMER,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
  }

  // *** Dành cho Auth ***
  async findOneByEmail(email: string): Promise<User | null> {
    // Auth cần lấy cả password, nên dùng query builder hoặc addSelect
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // Rất quan trọng
      .getOne();
  
    // Thêm dòng này:
    // Nếu 'user' là 'undefined' (không tìm thấy), nó sẽ trả về 'null'
    return user || null;
  }
}