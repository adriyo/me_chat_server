import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RoomService } from './room.service';

@Module({
  providers: [ChatGateway, RoomService],
})
export class WebsocketsModule {}
