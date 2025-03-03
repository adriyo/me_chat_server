import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SocketIoAdapter } from './websockets/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('origin'),
  });
  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));
  await app.listen(configService.get('port'));
}
bootstrap();
