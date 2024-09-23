import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { faker } from '@faker-js/faker';



@Injectable()
export class UserSeederService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async seed() {
    const batchSize = 10; // Number of users per batch
    const totalUsers = 100; // Total number of users to create
    let users: User[] = [];

    for (let i = 0; i < totalUsers; i++) {
      const user = new User();

      user.firstName = faker.person.firstName(); // Bill
      user.lastName = faker.person.lastName();  //  Hudson
      user.age = faker.number.int({ min: 18, max: 90 }) // 57
      user.gender = faker.helpers.arrayElement(['female', 'male'])
      user.problems = faker.datatype.boolean();  // Randomly set the problems flag

      users.push(user);

      // Insert in batches of 10,000 to avoid performance issues
      if (users.length === 10000) {
        await this.userRepository.save(users);
        users.length = 0;  // Reset the array
      }
    }

    // Save any remaining users
    if (users.length >= batchSize) {
      await this.userRepository.save(users);
      users = []; // Clear the array after saving
    }

    // Save any remaining users
    if (users.length > 0) {
      await this.userRepository.save(users);
    }

    console.log('User seeding completed.');
  }
}