import { I18nValue, ToolCredentialItem, ToolExtraInfo, ToolProperty, ToolRuleItem, ToolType } from '@inf-monkeys/monkeys';
import { AfterLoad, Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'tools' })
export class ToolsEntity extends BaseEntity {
  @Column({
    nullable: true,
    name: 'creator_user_id',
  })
  creatorUserId?: string;

  @Column({
    nullable: true,
  })
  teamId?: string;

  @Column({
    nullable: true,
  })
  public?: boolean;

  @Column({
    default: ToolType.SIMPLE,
    type: 'varchar',
  })
  type: ToolType;

  @Column()
  namespace: string;

  @Column()
  name: string;

  @Column({
    nullable: true,
    type: 'simple-json',
  })
  credentials?: ToolCredentialItem[];

  @Column({
    name: 'display_name',
    type: 'varchar',
  })
  displayName: string | I18nValue;

  @Column({
    nullable: true,
    type: 'varchar',
  })
  description?: string | I18nValue;

  @Column({
    nullable: true,
    type: 'simple-json',
  })
  categories?: string[];

  @Column({
    nullable: true,
  })
  icon?: string;

  @Column({
    nullable: true,
    comment: '表单配置',
    type: 'simple-json',
  })
  input: ToolProperty[];

  @Column({
    nullable: true,
    comment: '输出数据',
    type: 'simple-json',
  })
  output: ToolProperty[];

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  rules?: ToolRuleItem[];

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  extra?: ToolExtraInfo;

  @AfterLoad()
  afterLoad?() {
    try {
      this.displayName = JSON.parse(this.displayName as string);
    } catch (error) {}

    try {
      this.description = JSON.parse(this.description as string);
    } catch (error) {}
  }
}
