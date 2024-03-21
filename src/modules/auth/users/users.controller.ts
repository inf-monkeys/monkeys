import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(CompatibleAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('/me')
  public async listUsers(@Req() req: IRequest) {
    const { userId } = req;
    const data = await this.userService.findById(userId);
    return new SuccessResponse({
      data,
    });
  }
}
