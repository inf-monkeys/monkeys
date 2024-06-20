import { CredentialAuthType } from '@/common/typings/tools';
import { ToolProperty } from '@inf-monkeys/monkeys';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'tools_credential_types' })
export class ToolsCredentialTypeEntity extends BaseEntity {
  @Column()
  name: string;

  @Column()
  namespace: string;

  @Column({
    name: 'display_name',
  })
  displayName: string;

  @Column({
    type: 'varchar',
  })
  type: CredentialAuthType;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    nullable: true,
    name: 'icon_url',
  })
  iconUrl?: string;

  @Column({
    type: 'simple-json',
  })
  properties: ToolProperty[];
}
