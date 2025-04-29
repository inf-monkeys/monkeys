import { ApiProperty } from '@nestjs/swagger';
import { ObservabilityConfig, ObservabilityPlatform, ObservabilityPlatformConfig } from '../../interfaces/observability';

export class CreateWorkflowObservabilityDto implements ObservabilityConfig {
  @ApiProperty({
    description: '可观测性平台',
    required: true,
  })
  platform: ObservabilityPlatform;

  @ApiProperty({
    description: '可观测性平台配置',
    required: true,
  })
  platformConfig: ObservabilityPlatformConfig;

  @ApiProperty({
    description: '可观测性名称',
    required: false,
  })
  name?: string;
}
