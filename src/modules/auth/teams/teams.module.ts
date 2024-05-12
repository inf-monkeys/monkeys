import { ConductorModule } from '@/modules/workflow/conductor/conductor.module';
import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService],
  imports: [ConductorModule],
})
export class TeamsModule {}
