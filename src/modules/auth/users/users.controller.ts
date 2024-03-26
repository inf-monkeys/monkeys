import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserProfileDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Auth/Users')
@UseGuards(CompatibleAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('/profile')
  @ApiOperation({
    description: '获取用户资料',
    summary: '获取用户资料',
  })
  public async getUserProfile(@Req() req: IRequest) {
    const { userId } = req;
    const data = await this.userService.findById(userId);
    return new SuccessResponse({
      data,
    });
  }

  @Put('/profile')
  @ApiOperation({
    description: '修改用户资料',
    summary: '修改用户资料',
  })
  public async updateUserProfile(@Req() req: IRequest, @Body() body: UpdateUserProfileDto) {
    const { userId } = req;
    const { name, photo } = body;
    const data = await this.userService.updateUserInfo(userId, { name, photo });
    return new SuccessResponse({
      data,
    });
  }
}
