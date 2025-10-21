import { Module } from '@nestjs/common';
import { AgentV2Module } from '../agent-v2/agent-v2.module';
import { ToolsModule } from '../tools/tools.module';
import { TldrawAgentV2BridgeService } from './services/tldraw-agent-v2-bridge.service';
import { TldrawToolExecutorService } from './services/tldraw-tool-executor.service';
import { TldrawToolsRegistryService } from './services/tldraw-tools-registry.service';
import { TldrawAgentV2Controller } from './tldraw-agent-v2.controller';
import { TldrawAgentV2Service } from './tldraw-agent-v2.service';

@Module({
  imports: [
    AgentV2Module,
    ToolsModule,
  ],
  controllers: [TldrawAgentV2Controller],
  providers: [
    TldrawAgentV2Service,
    TldrawToolsRegistryService,
    TldrawToolExecutorService,
    TldrawAgentV2BridgeService,
  ],
  exports: [
    TldrawAgentV2Service,
    TldrawToolsRegistryService,
  ],
})
export class TldrawAgentV2Module {}
