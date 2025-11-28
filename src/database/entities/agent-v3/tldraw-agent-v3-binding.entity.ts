import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'tldraw_agent_v3_binding' })
@Index(['boardId', 'teamId'], { unique: true })
export class TldrawAgentV3BindingEntity extends BaseEntity {
  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @Column({ name: 'board_id' })
  boardId: string;

  @Column({ name: 'team_id' })
  @Index()
  teamId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;
}
