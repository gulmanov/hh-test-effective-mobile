import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserSeederService } from './user.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, UserSeederService],
  controllers: [UserController],
})
export class UserModule {}
