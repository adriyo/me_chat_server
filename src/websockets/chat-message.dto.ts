import { IsNotEmpty, IsString } from 'class-validator';

export default class ChatMessage {
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  chatRoom: string;

  @IsNotEmpty()
  @IsString()
  chatClientId: string;
}
