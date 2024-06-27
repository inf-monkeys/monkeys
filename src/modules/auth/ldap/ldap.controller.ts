import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginByLdapDto } from './dto/req/login-by-ldap.dto';
import { LDAPService } from './ldap.service';

@Controller('/auth/ldap')
@ApiTags('Auth/LDAP')
export class LdapController {
  constructor(private readonly ldapService: LDAPService) {}

  @Post('/login')
  @ApiOperation({
    description: '使用 LDAP 账号登录',
    summary: '使用 LDAP 账号登录',
  })
  async loginByLdap(@Body() body: LoginByLdapDto) {
    const { username, password } = body;
    const ldapUser = await this.ldapService.loginByLDAP(username, password);
    return ldapUser;
  }
}
