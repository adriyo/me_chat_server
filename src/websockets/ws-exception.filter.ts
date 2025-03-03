import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WebsocketExceptionFilter implements WsExceptionFilter {
  catch(_exception: WsException, host: ArgumentsHost) {
    const socket = host.switchToWs().getClient<Socket>();
    socket.emit('exception', {
      status: 'error',
      message: 'Ws message is invalid',
    });
  }
}
