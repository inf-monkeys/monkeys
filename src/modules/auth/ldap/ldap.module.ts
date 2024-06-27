import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { LdapController } from './ldap.controller';
import { LDAPService } from './ldap.service';

@Module({
  controllers: [LdapController],
  providers: [LDAPService],
  imports: [UsersModule],
})
export class LdapModule {}
