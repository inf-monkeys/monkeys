import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'workflow-chat-sessions' })
export class WorkflowChatSessionEntity extends BaseEntity {
  @Column()
  displayName: string;

  @Column()
  teamId: string;

  @Column()
  creatorUserId: string;

  @Column()
  workflowId: string;
}
