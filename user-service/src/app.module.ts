import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',      // We are using PostgreSQL
      host: 'localhost',     // PostgreSQL server address
      port: 5432,            // Default PostgreSQL port
      username: 'rustem',    // Replace with your PostgreSQL username
      password: 'hhTest!',   // Replace with your PostgreSQL password
      database: 'userdb',    // Name of the database to store user data
      entities: [User],      // Entities to manage (our User entity)
      synchronize: true,     // Auto-syncs the database schema (disable in production)
    }),
    UserModule,
  ],
})
export class AppModule {}
