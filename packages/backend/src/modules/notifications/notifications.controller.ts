import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class NotifyDto {
  title: string;
  message: string;
  link?: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async send(@CurrentUser('id') userId: string, @Body() dto: NotifyDto) {
    return this.notificationsService.createNotification(userId, dto.title, dto.message, dto.link);
  }

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.notificationsService.listUserNotifications(userId);
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
