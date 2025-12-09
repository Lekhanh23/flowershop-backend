import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications (Customer)')
@ApiBearerAuth()
@Controller('notifications') 
@UseGuards(JwtAuthGuard) 
export class CustomerNotificationsController {
  constructor(private readonly notifService: NotificationsService) {}

  @Get('my') 
  findMyNotifications(
    @GetUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return this.notifService.findByUser(user.id, page, limit);
  }
}