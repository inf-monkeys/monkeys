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

@Entity({ name: 'workflow_pages' })
export class WorkflowPageEntity extends BaseEntity {
  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    type: 'varchar',
  })
  type: PageInstance['type'];

  @Column({
    name: 'workflow_id',
    type: 'varchar',
  })
  workflowId: string;

  @Column({
    name: 'is_builtin',
    type: 'boolean',
  })
  isBuiltIn: boolean;

  @Column({
    name: 'team_id',
    type: 'varchar',
  })
  teamId: string;

  @Column({
    type: 'simple-json',
  })
  permissions: PagePermission[];

  @Column({
    name: 'sort_index',
    type: 'integer',
  })
  sortIndex: number;

  @Column({
    name: 'custom_options',
    type: 'simple-json',
    nullable: true,
  })
  customOptions?: Record<string, any>;

  @Column({
    default: false,
    type: 'boolean',
    nullable: true,
  })
  pinned?: boolean;
}
