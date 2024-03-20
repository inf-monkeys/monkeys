import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { LoginByPasswordDto } from './dto/req/login-by-password.dto';
import { PasswordService } from './password.service';

@Controller('/auth/password')
export class PasswordController {
  constructor(private readonly service: PasswordService) {}

  @Post('/login')
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
