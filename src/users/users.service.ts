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

  async findAll(page: number, limit: number, role?: UserRole) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }
    // Join bảng shipperProfile để lấy status
    queryBuilder.leftJoinAndSelect('user.shipperProfile', 'shipperProfile');
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.id', 'ASC')
      .getManyAndCount();
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

  async remove(id: number): Promise<void> { // Đổi tên từ removeCustomer
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
  async update(id: number, attrs: Partial<User>) {
    const user = await this.findOne(id); 
    Object.assign(user, attrs);
    return this.userRepository.save(user);
  }

  // *** Dành cho Auth ***
  async findOneByEmail(email: string): Promise<User | null> {
    // Auth cần lấy cả password
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // Rất quan trọng
      .getOne();
    // Nếu 'user' là 'undefined' (không tìm thấy), nó sẽ trả về 'null'
    return user || null;
  }

  async create(userData: any): Promise<User> {
    const newUser = this.userRepository.create(userData as User);
    return this.userRepository.save(newUser);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['shipperProfile'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}