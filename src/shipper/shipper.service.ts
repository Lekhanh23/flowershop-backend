import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ShipperApplication, ApplicationStatus } from './entities/shipper-application.entity';
import { ShipperProfile, ShipperStatus } from './entities/shipper-profile.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { UpdateShipperStatusDto, UpdateShipperProfileDto } from './dto/update-shipper.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class ShipperService {
    constructor(
        @InjectRepository(ShipperApplication)
        private applicationRepo: Repository<ShipperApplication>,
        @InjectRepository(ShipperProfile)
        private profileRepo: Repository<ShipperProfile>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        private notiService: NotificationsService,
        private dataSource: DataSource,
    ) { }

    async createApplication(user: User, dto: CreateApplicationDto) {
        const existing = await this.applicationRepo.findOne({
            where: { userId: user.id, status: ApplicationStatus.PENDING }
        });
        if (existing) throw new BadRequestException("Bạn đã có đơn đang chờ duyệt.");

        const app = this.applicationRepo.create({ userId: user.id, ...dto });
        const savedApp = await this.applicationRepo.save(app);

        const admins = await this.userRepo.find({where: {role: UserRole.ADMIN}});
        const userName = user.full_name || user.email || `User #${user.id}`;
        
        for(const admin of admins) {
            await this.notiService.create({
                userId: admin.id,
                targetUserId: user.id,
                type: 'admin_message',
                message: `User ${userName} has submitted a new application.`
            });
        }
        return savedApp;
    }

    async findAllApplication(status?: ApplicationStatus) {
        const where: any = {};
        if (status) where.status = status;
        return this.applicationRepo.find({
            where,
            relations: ['user'],
            order: {id: 'ASC' }
        });
    }

    async reviewApplication(id: number, adminUser: User, dto: ReviewApplicationDto) {
        const application = await this.applicationRepo.findOne({ where: { id } });
        if (!application) throw new NotFoundException("Application Not Found");
        
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            application.status = dto.status;
            application.adminNote = dto.adminNote || '';
            application.reviewedBy = adminUser.id;
            await queryRunner.manager.save(application);

            if (dto.status === ApplicationStatus.APPROVED) {
                await queryRunner.manager.update(User, application.userId, { role: UserRole.SHIPPER });

                const existingProfile = await queryRunner.manager.findOne(ShipperProfile, {
                    where: { userId: application.userId }
                });

                if (!existingProfile) {
                    let appData: any = {};
                    try {
                        appData = typeof application.applicationData === 'string' 
                            ? JSON.parse(application.applicationData) 
                            : application.applicationData;
                    } catch (e) {}

                    const profile = queryRunner.manager.create(ShipperProfile, {
                        userId: application.userId,
                        isVerified: true,
                        status: ShipperStatus.AVAILABLE,
                        nationalId: appData?.national_id || null, 
                        licenseNumber: appData?.license_number || null,
                        vehicleType: appData?.vehicle_type || null,
                        vehiclePlate: appData?.vehicle_plate || null,
                        bankAccount: appData?.bank_account || null,
                    });
                    await queryRunner.manager.save(profile);
                }
            }

            await queryRunner.commitTransaction();

            const isApproved = dto.status === ApplicationStatus.APPROVED;
            await this.notiService.create({
                userId: application.userId,
                type: 'admin_message',
                message: isApproved 
                    ? 'Chúc mừng! Đơn đăng ký Shipper của bạn đã được CHẤP THUẬN.' 
                    : `Đơn đăng ký Shipper của bạn đã bị TỪ CHỐI.`
            });

            return application;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async getProfile(userId: number) {
        const profile = await this.profileRepo.findOne({
            where: { userId },
            relations: ['user']
        });
        if (!profile) throw new NotFoundException("Hồ sơ Shipper không tồn tại");
        return profile;
    }

    async updateStatus(userId: number, dto: UpdateShipperStatusDto) {
        const profile = await this.getProfile(userId);
        profile.status = dto.status;
        return this.profileRepo.save(profile);
    }

    async updateProfile(userId: number, dto: UpdateShipperProfileDto) {
        if (dto.phone) {
            await this.userRepo.update(userId, { phone: dto.phone });
        }
        return this.getProfile(userId);
    }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        const user = await this.userRepo.createQueryBuilder("user")
            .where("user.id = :id", { id: userId })
            .addSelect("user.password")
            .getOne();
        if (!user) throw new NotFoundException("User not found");

        const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
        if (!isMatch) throw new BadRequestException("Mật khẩu cũ không chính xác");

        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(dto.newPassword, salt);
        return this.userRepo.save(user);
    }

    async getDashboard(userId: number) {
        const pending = await this.orderRepo.count({
            where: { 
                shipperId: userId, 
                deliveryStatus: In(['assigned', 'picked_up', 'in_transit'] as any[]) 
            }
        });

        const deliveredOrders = await this.orderRepo.find({
            where: {
                shipperId: userId,
                deliveryStatus: 'delivered' as any, 
            }
        });

        const totalDelivered = deliveredOrders.length;

        const totalRevenue = deliveredOrders.reduce((sum, order) => {
            return sum + Number(order.total_amount || 0); 
        }, 0);

        const totalIncome = totalRevenue * 0.10;

        return { pending, totalDelivered, totalIncome };
    }

    async getAssignedOrders(userId: number) {
        return this.orderRepo.find({
            where: { 
                shipperId: userId,
                deliveryStatus: In(['assigned', 'picked_up', 'in_transit'] as any[]) 
            },
            order: { order_date: 'DESC' },
            relations: ['orderItems', 'user']
        });
    }

    async getHistory(userId: number, days: number = 30) {
        const date = new Date();
        date.setDate(date.getDate() - days);

        return this.orderRepo.find({
            where: {
                shipperId: userId,
                deliveryStatus: In(['delivered', 'failed', 'cancelled'] as any[]),
            },
            order: { order_date: 'DESC' },
            relations: ['user'] 
        });
    }

    async getOrderDetail(userId: number, orderId: number) {
        const order = await this.orderRepo.findOne({
            where: { id: orderId, shipperId: userId },
            relations: ['orderItems', 'orderItems.product', 'user']
        });
        if (!order) throw new NotFoundException("Đơn hàng không tồn tại hoặc không thuộc quyền quản lý của bạn.");
        return order;
    }

    async updateOrderStatus(userId: number, orderId: number, status: string, proofImage?: string) {
        const order = await this.getOrderDetail(userId, orderId);
        
        if (status === 'delivered' && !proofImage) {
            throw new BadRequestException("Cần có ảnh xác thực khi giao hàng thành công.");
        }

        order.deliveryStatus = status as any;

        if (status === 'delivered') {
            order.deliveredAt = new Date();
            order.status = OrderStatus.DELIVERED;
        }

        return this.orderRepo.save(order);
    }

    async getNotifications(userId: number, page: number = 1, limit: number = 20) {
        return this.notiService.findByUser(userId, page, limit);
    }
}