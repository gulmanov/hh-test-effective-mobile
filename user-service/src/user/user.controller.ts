import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('seed')
  async seedUsers() {
    await this.userService.seedUsers();
    return 'User seeding completed';
  }

  @Get('reset-problems')
  async resetProblems(): Promise<number> {
    const count = await this.userService.resetProblemsAndCount();
    return count;
  }
}
