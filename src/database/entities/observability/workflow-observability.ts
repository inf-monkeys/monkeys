import { ObservabilityPlatform, ObservabilityPlatformConfig } from '@/modules/workflow/interfaces/observability';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'workflow_observability' })
export class WorkflowObservabilityEntity extends BaseEntity {
  @Column({ name: 'workflow_id' })
  workflowId: string;

  @Column({ name: 'team_id' })
  teamId: string;

  @Column({ name: 'name', nullable: true })
  name?: string;

  @Column({ name: 'platform' })
  platform: ObservabilityPlatform;

  @Column({ name: 'platform_config', type: 'simple-json' })
  platformConfig: ObservabilityPlatformConfig;
}
