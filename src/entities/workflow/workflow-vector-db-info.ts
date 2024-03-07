import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface INodeCredentialDescription {
  name: string;
  required?: boolean;
}

@Entity({ name: 'system-workflow-vector-db-info' })
export class WorkflowVectorDbInfoEntity extends BaseEntity {
  @Column()
  initilized: boolean;

  @Column()
  dbId: string;
}
