import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'workflow-templates' })
export class WorkflowTemplateEntity extends BaseEntity {
  @Column()
  name: string;

  @Column()
  desc?: string;

  @Column()
  logo?: string;

  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'workflow_id',
  })
  workflowId: string;

  @Column({
    name: 'workflow_version',
  })
  workflowVersion: number;

  @Column({
    name: 'creator_user_id',
  })
  creatorUserId: string;

  @Column({
    name: 'fetch_count',
  })
  fetchCount: number;

  @Column({
    type: 'simple-json',
    name: 'assets_policy',
  })
  assetsPolicy: { [x: string]: any };
}
