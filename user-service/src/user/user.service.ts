import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserSeederService } from './user.seed';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userSeeder: UserSeederService,
  ) {}

  async seedUsers() {
    await this.userSeeder.seed();
  }

  async resetProblemsAndCount(): Promise<number> {
    const usersWithProblems = await this.userRepository.count({
      where: { problems: true },
    });

    await this.userRepository.update({ problems: true }, { problems: false });

    return usersWithProblems;
  }
}
