import { CredentialAuthType } from '@/modules/tools/interfaces';
import { BlockDefProperties } from '@inf-monkeys/vines';
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
  })
  icon?: string;

  @Column({
    type: 'simple-json',
  })
  properties: BlockDefProperties[];
}
