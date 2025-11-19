import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

/**
 * AgentV3SessionEntity
 * 会话记录（按 team/user 隔离）
 */
@Entity({ name: 'agent_v3_sessions' })
@Index(['teamId', 'userId'])
@Index(['teamId', 'updatedTimestamp'])
export class AgentV3SessionEntity extends BaseEntity {
  @Column({ name: 'team_id' })
  @Index()
  teamId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'title', nullable: true })
  @Index()
  title?: string;

  @Column({ name: 'model_id', nullable: true })
  @Index()
  modelId?: string;
}
