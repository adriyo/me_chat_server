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
import { ChatMode, User } from './user.dto';
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
    const chatMode = client.handshake.auth.chatMode as ChatMode;
    if (!['single', 'multiple'].includes(chatMode)) {
      client.disconnect();
      return;
    }

    const existingUser = this.roomService.findUserByNickname(nickname);
    if (existingUser) {
      client.disconnect();
      return;
    }

    let finalRoomName = chatRoomName;
    if (chatMode === 'single') {
      // For single mode, try to find an available room or create a new one
      const availableRoom =
        this.roomService.findAvailableSingleRoom(chatRoomName);
      if (availableRoom) {
        finalRoomName = availableRoom;
      } else {
        // Create a new room with unique identifier
        finalRoomName = `${chatRoomName}-${Date.now()}`;
      }
    }

    const user: User = {
      id: client.id,
      nickname: nickname,
      chatRoom: finalRoomName,
      chatMode: chatMode,
    };

    if (chatMode === 'multiple') {
      const roomUsers = this.roomService.getRoomUsers(finalRoomName);
      if (roomUsers.length > 0 && roomUsers[0].chatMode === 'single') {
        client.disconnect();
        return;
      }
    }

    this.roomService.addUserToRoom(user);
    await client.join(finalRoomName);
    this.log(user);
    this.server.emit(
      'room-users',
      this.roomService.getRoomUsers(finalRoomName),
    );
    client.to(finalRoomName).emit('chat-joined', user);
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
