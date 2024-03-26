import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginByPasswordDto } from './dto/req/login-by-password.dto';
import { PasswordService } from './password.service';

@Controller('/auth/password')
@ApiTags('Auth/Password')
export class PasswordController {
  constructor(private readonly service: PasswordService) {}

  @Post('/login')
  @ApiOperation({
    description: '使用密码登录',
    summary: '使用密码登录',
  })
  public async loginByPassword(@Req() req: IRequest, @Body() body: LoginByPasswordDto) {
    const { email, password } = body;
    const token = await this.service.loginByPassword(email, password);
    return new SuccessResponse({
      data: {
        token: token,
      },
    });
  }
}
