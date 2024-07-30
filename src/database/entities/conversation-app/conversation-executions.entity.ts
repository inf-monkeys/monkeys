import { ConversationStatusEnum } from '@/common/dto/status.enum';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'conversation_executions' })
export class ConversationExecutionEntity extends BaseEntity {
  @Column({
    name: 'app_id',
  })
  appId: string;

  @Column({
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'status',
    nullable: true,
    type: 'varchar',
    length: 255,
  })
  status: ConversationStatusEnum;

  @Column({
    name: 'takes',
    nullable: true,
  })
  takes: number;
}
