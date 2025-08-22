import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppConfig } from '@party/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: AppConfig.API.CORS_ORIGINS,
    credentials: true,
  });

  // Create and configure the WebSocket adapter
  const wsAdapter = new IoAdapter(app);
  app.useWebSocketAdapter(wsAdapter);

  // Start the app
  await app.listen(process.env.PORT ?? AppConfig.BACKEND.NEST.PORT);

  console.log('✅ App started successfully');
}

void bootstrap();
