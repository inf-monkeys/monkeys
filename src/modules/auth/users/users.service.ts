import { UserRepository } from '@/repositories/user.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  public async findById(userId: string) {
    return await this.userRepository.findById(userId);
  }

  async updateUserInfo(userId: string, data: { name?: string; photo?: string }) {
    return await this.userRepository.updateUserInfo(userId, data);
  }
}
