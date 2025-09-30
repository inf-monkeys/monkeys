import { Module } from '@nestjs/common';
import { TldrawAgentController } from './tldraw-agent.controller';
import { TldrawAgentGateway } from './tldraw-agent.gateway';
import { TldrawAgentService } from './tldraw-agent.service';

@Module({
  controllers: [TldrawAgentController],
  providers: [TldrawAgentService, TldrawAgentGateway],
})
export class TldrawAgentModule {}



