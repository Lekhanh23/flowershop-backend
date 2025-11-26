import { Controller, Post, Get, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ShipperService } from './shipper.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole, User } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Shipper')
@ApiBearerAuth()
@Controller('shipper')
@UseGuards(AuthGuard('jwt'))
export class ShipperController {
    constructor(private readonly shipperService : ShipperService) {}

    //User gửi đơn đăng ký
    @Post('apply')
    apply(@GetUser() user : User, @Body() dto: CreateApplicationDto) {
        return this.shipperService.createApplication(user, dto);
    }

    //Admin xem danh sách đơn
    @Get('applications')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getAllApplications() {
        return this.shipperService.findAllApplication();
    }

    //Admin duyệt đơn
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
}
