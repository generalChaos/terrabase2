import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Create and configure the WebSocket adapter
  const wsAdapter = new IoAdapter(app);
  app.useWebSocketAdapter(wsAdapter);

  // Start the app
  await app.listen(process.env.PORT ?? 3001);

  console.log('✅ App started successfully');
}

void bootstrap();
