import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'themes' })
export class ThemeEntity extends BaseEntity {
  @Column({ nullable: true })
  teamId?: string;

  @Column()
  name: string; // 主题名称

  @Column({ nullable: true })
  primaryColor?: string;

  @Column({ nullable: true })
  backgroundColor?: string;

  @Column({ nullable: true })
  secondaryBackgroundColor?: string;

  @Column({ nullable: true })
  isPublic?: boolean;
}
