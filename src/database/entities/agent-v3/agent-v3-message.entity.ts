import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

/**
 * AgentV3MessageEntity
 * 会话中的消息，完整保留 user/assistant/tool 历史
 */
@Entity({ name: 'agent_v3_messages' })
@Index(['sessionId', 'sequence'])
@Index(['sessionId', 'createdTimestamp'])
@Index(['teamId', 'createdTimestamp'])
export class AgentV3MessageEntity extends BaseEntity {
  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @Column({ name: 'team_id' })
  @Index()
  teamId: string;

  @Column({ name: 'role' })
  @Index()
  role: 'system' | 'user' | 'assistant' | 'tool';

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'tool_call_id', nullable: true })
  @Index()
  toolCallId?: string;

  @Column({ name: 'tool_name', nullable: true })
  @Index()
  toolName?: string;

  @Column({ name: 'tool_input', type: 'text', nullable: true })
  toolInput?: string;

  @Column({ name: 'tool_output', type: 'text', nullable: true })
  toolOutput?: string;

  @Column({ name: 'model_id', nullable: true })
  @Index()
  modelId?: string;

  @Column({ name: 'sequence', type: 'integer' })
  sequence: number;
}
