import { Injectable } from '@nestjs/common';
import { User } from './user.dto';
import ChatMessage from './chat-message.dto';

@Injectable()
export class RoomService {
  private rooms: Map<string, User[]> = new Map();
  private messages: ChatMessage[] = [];

  findUserById(userId: string): User | undefined {
    for (const users of this.rooms.values()) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        return user;
      }
    }
    return undefined;
  }

  findRoomByName(roomName: string): User[] | undefined {
    return this.rooms.get(roomName);
  }

  addUserToRoom(user: User) {
    if (!this.rooms.has(user.chatRoom)) {
      this.rooms.set(user.chatRoom, []);
    }
    const users = this.rooms.get(user.chatRoom);
    if (users) {
      users.push(user);
    }
  }

  removeUserFromRoom(userId: string, roomName: string) {
    if (!this.rooms.has(roomName)) return;
    const roomUsers = this.rooms.get(roomName);
    this.rooms.set(
      roomName,
      roomUsers.filter((u) => u.id !== userId),
    );
  }

  getRoomUsers(roomName: string): User[] {
    return this.rooms.get(roomName) ?? [];
  }

  getUsersCount(roomName: string): number {
    return this.getRoomUsers(roomName).length;
  }

  getRoomNames(): string[] {
    return Array.from(this.rooms.keys());
  }

  addMessage(message: ChatMessage) {
    this.messages.push(message);
  }

  getMessages(): ChatMessage[] {
    return this.messages;
  }

  getMessagesCount(roomId: string): number {
    return this.messages.filter((m) => m.chatRoom === roomId).length;
  }

  findUserByNickname(nickname: string): User | undefined {
    for (const users of this.rooms.values()) {
      const user = users.find((u) => u.nickname === nickname);
      if (user) {
        return user;
      }
    }
    return undefined;
  }

  findAvailableSingleRoom(baseName: string): string | null {
    for (const [roomName, users] of this.rooms.entries()) {
      if (
        roomName.startsWith(baseName) &&
        users[0]?.chatMode === 'single' &&
        users.length < 2
      ) {
        return roomName;
      }
    }
    return null;
  }
}
