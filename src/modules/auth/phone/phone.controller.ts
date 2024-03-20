import { SuccessResponse } from '@/common/response';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { LoginByPhoneDto } from './dto/req/login-by-phone.dto';
import { PhoneService } from './phone.service';

const phoneNumberRegexp = /^1[3456789]\d{9}$/;

@Controller('/auth/phone')
export class PhoneController {
  constructor(private readonly service: PhoneService) {}

  @Post('/send-sms')
  public async startPhoneVerify(@Body('phoneNumber') phoneNumber: string) {
    if (!phoneNumber || !phoneNumberRegexp.test(phoneNumber)) {
      return new BadRequestException('手机号格式有误');
    }
    const res = await this.service.sendPhoneNumberVerifyCode(phoneNumber);
    return new SuccessResponse({
      data: res,
    });
  }

  @Post('/login')
  public async loginByPhone(@Body() body: LoginByPhoneDto) {
    const { phoneNumber, verifyCode } = body;
    const token = await this.service.loginByPhoneNumber(phoneNumber, verifyCode);
    return new SuccessResponse({
      data: {
        token: token,
      },
    });
  }
}
