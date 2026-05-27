import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsGateway } from './notifications.gateway';
import { Injectable, Logger } from '@nestjs/common';

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly gateway: NotificationsGateway) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    const { notificationId, userId, title, message, link } = job.data;
    this.logger.log(`Dispatching notification ${notificationId} for user ${userId}`);
    this.gateway.broadcastNotification({ notificationId, title, message, link, userId });
    return { success: true };
  }
}
