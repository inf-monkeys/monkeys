import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { TeamEntity } from '../identity/team';
import { UserEntity } from '../identity/user';

/**
 * AgentV2Entity
 * 团队下的智能体（v2版），支持对话与MCP工具调用
 */
@Entity({ name: 'agent_v2' })
@Index(['teamId', 'name'], { unique: true })
export class AgentV2Entity extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'team_id' })
  teamId: string;

  @ManyToOne(() => TeamEntity)
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity;

  @Column({ name: 'created_by' })
  @Index()
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @Column({ name: 'icon_url', nullable: true })
  iconUrl?: string;

  @Column({ name: 'config', type: 'json', nullable: true })
  config?: Record<string, any>;
}
