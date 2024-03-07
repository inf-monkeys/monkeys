import { BlockType } from '@inf-monkeys/vines';
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base/base';

export interface INodeCredentialDescription {
  name: string;
  required?: boolean;
}

@Entity({ name: 'tools' })
export class ToolsEntity extends BaseEntity {
  @Column({
    nullable: true,
  })
  creatorUserId?: string;

  @Column({
    nullable: true,
  })
  teamId?: string;

  @Column({
    nullable: true,
  })
  public: boolean;

  @Column({
    default: BlockType.SIMPLE,
  })
  type: BlockType;

  @Column()
  namespace: string;

  @Column()
  name: string;

  // @Column({
  //   nullable: true,
  // })
  // credentials?: INodeCredentialDescription[];

  @Column()
  displayName: string;

  @Column({
    nullable: true,
  })
  description?: string;

  // @Column({
  //   nullable: true,
  // })
  // categories?: string[];

  @Column({
    nullable: true,
  })
  icon?: string;

  // @Column({
  //   nullable: true,
  //   comment: '表单配置',
  // })
  // input: BlockDefProperties[];

  // @Column({
  //   nullable: true,
  //   comment: '输出数据',
  // })
  // output: BlockDefProperties[];

  // @Column()
  // rules?: BlockRuleItem[];

  // @Column()
  // extra?: BlockExtraInfo;
}
