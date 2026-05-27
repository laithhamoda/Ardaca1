import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinTenant')
  handleJoinTenant(@MessageBody() organisationId: string) {
    return { event: 'joinedTenant', organisationId };
  }

  broadcastNotification(data: any) {
    this.server.emit('notification', data);
  }
}
