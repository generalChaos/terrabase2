import { Module } from '@nestjs/common';
import { RoomsModule } from './rooms/rooms.module';
import { AppController } from './app.controller';

@Module({
  imports: [RoomsModule],
  controllers: [AppController],
})
export class AppModule {}
