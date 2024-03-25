import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'system_configurations' })
export class SystemConfigurationEntity extends BaseEntity {
  @Column({
    name: 'key',
  })
  key: string;

  @Column({
    name: 'value',
  })
  value: string;
}
