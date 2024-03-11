import { BlockDefProperties } from '@inf-monkeys/vines';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export type PagePermission = 'read' | 'write' | 'exec' | 'permission';

export type PageInstanceType = 'process' | 'log' | 'chat' | 'preview' | 'api';

export interface PageInstance {
  name: string;
  icon: string;
  type: PageInstanceType;
  allowedPermissions: PagePermission[];
  customOptionsProperties?: BlockDefProperties[];
}

@Entity({ name: 'workflow-pages' })
export class WorkflowPageEntity extends BaseEntity {
  @Column()
  displayName: string;

  @Column()
  type: PageInstance['type'];

  @Column()
  workflowId: string;

  @Column()
  isBuiltIn: boolean;

  @Column()
  creatorUserId: string;

  @Column()
  teamId: string;

  @Column()
  permissions: PagePermission[];

  @Column()
  apiKey: string;

  @Column()
  sortIndex: number;

  @Column()
  customOptions?: Record<string, any>;

  @Column()
  pinned?: boolean;
}
