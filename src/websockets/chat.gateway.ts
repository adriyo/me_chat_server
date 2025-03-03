import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { WebsocketExceptionFilter } from './ws-exception.filter';
import { Server, Socket } from 'socket.io';
import ChatMessage from './chat-message.dto';
import { User } from './user.dto';
import { RoomService } from './room.service';

@WebSocketGateway()
@UseFilters(new WebsocketExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  async handleConnection(client: Socket) {
    const nickname = client.handshake.auth.nickname as string;
    const chatRoomName = client.handshake.auth.chatRoomName as string;
    const user: User = {
      id: client.id,
      nickname: nickname,
      chatRoom: chatRoomName,
    };
    this.roomService.addUserToRoom(user);
    await client.join(chatRoomName);
    this.log(user);
    this.server.emit('room-users', this.roomService.getRoomUsers(chatRoomName));
    client.to(chatRoomName).emit('chat-joined', user);
  }

  handleDisconnect(client: Socket) {
    const user = this.roomService.findUserById(client.id);
    if (user) {
      this.roomService.removeUserFromRoom(user.id, user.chatRoom);
      client.to(user.chatRoom).emit('chat-left', user.id);
    }
    console.log('User disconnected..', client.id);
  }

  @SubscribeMessage('chat')
  @UsePipes(new ValidationPipe())
  handleMessage(@MessageBody() message: ChatMessage) {
    const user = this.roomService.findUserById(message.chatClientId);
    if (user) {
      this.roomService.addMessage(message);
      this.server.to(user.chatRoom).emit('chat', {
        ...message,
        id: this.roomService.getMessagesCount(message.chatRoom),
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get-room-users')
  handleGetRoomUsers(client: Socket) {
    const user = this.roomService.findUserById(client.id);
    if (user) {
      client.emit('room-users', this.roomService.getRoomUsers(user.chatRoom));
    }
  }

  log(user: User) {
    console.log(
      'New user connected..',
      user.id,
      ' with nickname: ',
      user.nickname,
      ' with chatRoom: ',
      user.chatRoom,
    );
  }
}
