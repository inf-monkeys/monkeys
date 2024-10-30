import { Module } from '@nestjs/common';
import { TeamsModule } from '../teams/teams.module';
import { PasswordController } from './password.controller';
import { PasswordService } from './password.service';

@Module({
  controllers: [PasswordController],
  providers: [PasswordService],
  imports: [TeamsModule],
})
export class PasswordModule {}
