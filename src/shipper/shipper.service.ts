import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ShipperApplication, ApplicationStatus } from './entities/shipper-application.entity';
import { ShipperProfile, ShipperStatus } from './entities/shipper-profile.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';

@Injectable()
export class ShipperService {
    constructor(
        @InjectRepository(ShipperApplication)
        private applicationRepo : Repository<ShipperApplication>,
        @InjectRepository(ShipperProfile)
        private profileRepo : Repository<ShipperProfile>,
        private dataSource : DataSource,
    ) {}
    // 1. User gửi đơn đăng ký
    async createApplication(user: User, dto: CreateApplicationDto) {
        const existing = await this.applicationRepo.findOne({
            where: {userId: user.id, status: ApplicationStatus.PENDING}
        });
        if (existing) {
            throw new BadRequestException("You already have a pending apllication");
        }
        const app = this.applicationRepo.create ({
            userId: user.id,
            ...dto,
        });
        return this.applicationRepo.save(app);
    }
    // 2. Admin xem tất cả đơn
    async findAllApplication() {
        return this.applicationRepo.find({
            relations: ['user'],
            order: {createdAt: 'DESC'}
        });
    }
    //Admin duyệt đơn
    async reviewApplication(id: number, adminUser: User, dto: ReviewApplicationDto) {
        const application = await this.applicationRepo.findOne({where: {id}});
        if(!application) {
            throw new NotFoundException("Application Not Found");
        }
        if(application.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException("Application already reviewed");
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // B1: Cập nhật Application
            application.status = dto.status;
            application.adminNote = dto.adminNote || '';
            application.reviewedBy = adminUser.id;
            await queryRunner.manager.save(application);

            // B2: Nếu Approved -> Update User Role & Create Profile
            if(dto.status === ApplicationStatus.APPROVED) {
                // Update User Role
                await queryRunner.manager.update(User, application.userId, {
                    role: UserRole.SHIPPER
                });
                // Create Profile (nếu chưa có)
                const exitstingProfile = await queryRunner.manager.findOne(ShipperProfile, {
                    where: {userId: application.userId}
                });
                if(!exitstingProfile) {
                    const profile = queryRunner.manager.create(ShipperProfile, {
                        userId: application.userId,
                        isVerified: true,
                        status: ShipperStatus.AVAILABLE
                    });
                    await queryRunner.manager.save(profile);
                }
            }
            await queryRunner.commitTransaction();
            return application;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
