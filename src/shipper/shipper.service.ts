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
        private applicationRepo: Repository<ShipperApplication>,
        @InjectRepository(ShipperProfile)
        private profileRepo: Repository<ShipperProfile>,
        private dataSource: DataSource,
    ) { }

    // 1. User gửi đơn đăng ký
    async createApplication(user: User, dto: CreateApplicationDto) {
        const existing = await this.applicationRepo.findOne({
            where: { userId: user.id, status: ApplicationStatus.PENDING }
        });
        if (existing) throw new BadRequestException("Bạn đã có đơn đang chờ duyệt.");

        const app = this.applicationRepo.create({ userId: user.id, ...dto });
        return this.applicationRepo.save(app);
    }

    // 2. Admin xem danh sách đơn (có hỗ trợ lọc theo status)
    async findAllApplication(status?: ApplicationStatus) {
        const where: any = {};
        if (status) where.status = status;

        return this.applicationRepo.find({
            where,
            relations: ['user'],
            order: {id: 'ASC' }
        });
    }

    // 3. Admin duyệt đơn
    async reviewApplication(id: number, adminUser: User, dto: ReviewApplicationDto) {
        const application = await this.applicationRepo.findOne({ where: { id } });
        if (!application) throw new NotFoundException("Application Not Found");
        
        // Cho phép duyệt lại nếu cần, hoặc chặn: if (application.status !== 'pending') ...

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // B1: Update Application Status
            application.status = dto.status;
            application.adminNote = dto.adminNote || '';
            application.reviewedBy = adminUser.id;
            await queryRunner.manager.save(application);

            // B2: Nếu Approved -> Nâng cấp User & Tạo Profile
            if (dto.status === ApplicationStatus.APPROVED) {
                await queryRunner.manager.update(User, application.userId, { role: UserRole.SHIPPER });

                const existingProfile = await queryRunner.manager.findOne(ShipperProfile, {
                    where: { userId: application.userId }
                });

                if (!existingProfile) {
                    // Parse JSON data
                    let appData: any = {};
                    try {
                        appData = typeof application.applicationData === 'string' 
                            ? JSON.parse(application.applicationData) 
                            : application.applicationData;
                    } catch (e) {}

                    // Tạo Profile từ dữ liệu đơn đăng ký
                    const profile = queryRunner.manager.create(ShipperProfile, {
                        userId: application.userId,
                        isVerified: true,
                        status: ShipperStatus.AVAILABLE, // Mặc định sẵn sàng
                        nationalId: appData?.nationalId || null,
                        licenseNumber: appData?.licenseNumber || null,
                        vehicleType: appData?.vehicleType || null,
                        vehiclePlate: appData?.licensePlate || null,
                        bankAccount: appData?.bankAccount || null,
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