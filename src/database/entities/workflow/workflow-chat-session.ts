import { ChatCompletionMessageParam } from 'openai/resources';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'workflow_chat_sessions' })
export class WorkflowChatSessionEntity extends BaseEntity {
  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'creator_user_id',
  })
  creatorUserId: string;

  @Column({
    name: 'workflow_id',
  })
  workflowId: string;

  @Column({
    name: 'messages',
    nullable: true,
    type: 'simple-json',
  })
  messages?: Array<ChatCompletionMessageParam>;
}
