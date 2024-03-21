import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UpdateUserProfileDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(CompatibleAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('/profile')
  public async getUserProfile(@Req() req: IRequest) {
    const { userId } = req;
    const data = await this.userService.findById(userId);
    return new SuccessResponse({
      data,
    });
  }

  @Put('/profile')
  public async updateUserProfile(@Req() req: IRequest, @Body() body: UpdateUserProfileDto) {
    const { userId } = req;
    const { name, photo } = body;
    const data = await this.userService.updateUserInfo(userId, { name, photo });
    return new SuccessResponse({
      data,
    });
  }
}
