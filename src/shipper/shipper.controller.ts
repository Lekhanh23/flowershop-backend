import { 
    Controller, Post, Get, Patch, Body, Param, Query, 
    UseGuards, UseInterceptors, UploadedFiles, BadRequestException, ParseIntPipe, UploadedFile 
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShipperService } from './shipper.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User, UserRole } from 'src/users/entities/user.entity';
import { ApplicationStatus } from './entities/shipper-application.entity';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { UpdateShipperStatusDto, UpdateShipperProfileDto } from './dto/update-shipper.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Shipper')
@ApiBearerAuth()
@Controller('shipper')
@UseGuards(AuthGuard('jwt'))
export class ShipperController {
    constructor(private readonly shipperService : ShipperService) {}

    @Post('apply')
    @UseInterceptors(FilesInterceptor('documents', 10, {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                callback(null, `shipper-${uniqueSuffix}${ext}`);
            },
        }),
    }))
    async apply(
        @GetUser() user: User,
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() body: any
    ) {
        if(!files || files.length === 0) {
            throw new BadRequestException('Vui lòng tải lên tài liệu xác minh.');
        }
        
        const filePaths = files.map(f => f.filename).join(',');
        let appData = body.application_data;
        if(typeof appData === 'string') {
            try { appData = JSON.parse(appData); } catch(e) {}
        }
        
        const dto = {
            resumeText: body.resume_text,
            applicationData: appData,
            documents: filePaths,
        };
        return this.shipperService.createApplication(user, dto);
    }

    @Get('applications')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getAllApplications(@Query('status') status?: ApplicationStatus) {
        return this.shipperService.findAllApplication(status);
    }

    @Patch('applications/:id/review')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    reviewApplication(
        @Param('id', ParseIntPipe) id: number,
        @GetUser() admin: User,
        @Body() dto: ReviewApplicationDto
    ) {
        return this.shipperService.reviewApplication(id, admin, dto);
    }

    @Get('profile')
    @Roles(UserRole.SHIPPER)
    getProfile(@GetUser() user: User) {
        return this.shipperService.getProfile(user.id);
    }

    @Patch('profile/status')
    @Roles(UserRole.SHIPPER)
    updateStatus(@GetUser() user: User, @Body() dto: UpdateShipperStatusDto) {
        return this.shipperService.updateStatus(user.id, dto);
    }

    @Patch('profile/update')
    @Roles(UserRole.SHIPPER)
    updateProfile(@GetUser() user: User, @Body() dto: UpdateShipperProfileDto) {
        return this.shipperService.updateProfile(user.id, dto);
    }

    @Patch('profile/password')
    @Roles(UserRole.SHIPPER)
    changePassword(@GetUser() user: User, @Body() dto: ChangePasswordDto) {
        return this.shipperService.changePassword(user.id, dto);
    }

    @Get('dashboard')
    @Roles(UserRole.SHIPPER)
    getDashboard(@GetUser() user: User) {
        return this.shipperService.getDashboard(user.id);
    }

    @Get('assigned')
    @Roles(UserRole.SHIPPER)
    getAssigned(@GetUser() user: User) {
        return this.shipperService.getAssignedOrders(user.id);
    }

    @Get('history')
    @Roles(UserRole.SHIPPER)
    getHistory(@GetUser() user: User, @Query('days') days: number) {
        return this.shipperService.getHistory(user.id, days);
    }

    @Get('orders/:id')
    @Roles(UserRole.SHIPPER)
    getOrderDetail(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
        return this.shipperService.getOrderDetail(user.id, id);
    }

    @Post('orders/:id/status')
    @Roles(UserRole.SHIPPER)
    @UseInterceptors(FileInterceptor('proof', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                callback(null, `proof-${randomName}${extname(file.originalname)}`)
            }
        })
    }))
    async updateOrderStatus(
        @GetUser() user: User,
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        const proofPath = file ? file.filename : undefined;
        return this.shipperService.updateOrderStatus(user.id, id, status, proofPath);
    }

    @Get('notifications')
    @Roles(UserRole.SHIPPER)
    getNotifications(
        @GetUser() user: User,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return this.shipperService.getNotifications(user.id, page, limit);
    }
}