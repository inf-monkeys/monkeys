import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'themes' })
export class Theme extends BaseEntity {
  @Column()
  teamId?: string;

  @Column()
  name: string; // 主题名称

  @Column()
  primaryColor?: string;

  @Column()
  backgroundColor?: string;

  @Column()
  secondaryBackgroundColor?: string;

  @Column()
  isPublic?: boolean;
}
