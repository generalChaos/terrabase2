import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
@Module({ controllers: [RoomsController], providers: [RoomsGateway] })
export class RoomsModule {}
