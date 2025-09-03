import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { UserEntity } from '../identity/user';
import { AgentV2Entity } from './agent-v2.entity';

/**
 * AgentV2SessionEntity
 * 智能体会话记录
 */
@Entity({ name: 'agent_v2_sessions' })
export class AgentV2SessionEntity extends BaseEntity {
  @Column({ name: 'agent_id' })
  @Index()
  agentId: string;

  @ManyToOne(() => AgentV2Entity)
  @JoinColumn({ name: 'agent_id' })
  agent: AgentV2Entity;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'title', nullable: true })
  @Index()
  title?: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
