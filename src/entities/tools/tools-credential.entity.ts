import { CredentialAuthType } from '@/modules/worker/interfaces';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'tools_credential' })
export class ToolsCredentialEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column()
  type: CredentialAuthType;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    nullable: true,
  })
  icon?: string;
}
