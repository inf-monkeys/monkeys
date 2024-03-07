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

  @Column()
  teamId: string;

  @Column()
  workflowId: string;

  @Column()
  workflowVersion: number;

  @Column()
  creatorUserId: string;

  @Column()
  categoryIds: string[];

  @Column()
  fetchCount: number;

  @Column()
  assetsPolicy: { [x: string]: any };
}
