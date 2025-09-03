import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base/base';
import { UserEntity } from '../identity/user';
import { AgentV2SessionEntity } from './agent-v2-session.entity';

/**
 * AgentV2MessageEntity
 * 会话中的消息
 */
@Entity({ name: 'agent_v2_messages' })
export class AgentV2MessageEntity extends BaseEntity {
  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @ManyToOne(() => AgentV2SessionEntity)
  @JoinColumn({ name: 'session_id' })
  session: AgentV2SessionEntity;

  @Column({ name: 'sender_id' })
  @Index()
  senderId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  toolCalls?: any;

  @Column({ type: 'boolean', default: false })
  isSystem?: boolean;
}
