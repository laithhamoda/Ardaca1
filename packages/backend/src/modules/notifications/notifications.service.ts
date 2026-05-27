import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async createNotification(userId: string, title: string, message: string, link?: string, metadata?: Record<string, any>) {
    const notification = this.notificationRepository.create({
      user: { id: userId } as any,
      title,
      message,
      link,
      metadata,
    });
    const saved = await this.notificationRepository.save(notification);
    await this.notificationQueue.add('send-notification', {
      notificationId: saved.id,
      userId,
      title,
      message,
      link,
    });
    return saved;
  }

  async listUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string) {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId } });
    if (!notification) return null;
    notification.read = true;
    return this.notificationRepository.save(notification);
  }
}
