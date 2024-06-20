import { ToolProperty } from '@inf-monkeys/monkeys';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'tools_trigger_types' })
@Index(['type'])
export class ToolsTriggerTypesEntity extends BaseEntity {
  @Column({
    type: 'varchar',
  })
  type: string;

  @Column()
  namespace: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    nullable: true,
  })
  icon?: string;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  properties: ToolProperty[];

  @Column({
    type: 'simple-json',
    nullable: true,
    name: 'workflow_inputs',
  })
  workflowInputs: ToolProperty[];
}
