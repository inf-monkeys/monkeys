import { Column, PrimaryColumn } from 'typeorm';

/**
 * Admin 模块专用的基类，时间字段使用 bigint 毫秒时间戳，
 * 避免影响全局 BaseEntity 的 timestamp 语义。
 */
export class AdminBaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 128,
  })
  id: string;

  @Column({
    name: 'created_timestamp',
    type: 'bigint',
    default: () => 'FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)',
  })
  createdTimestamp: number;

  @Column({
    name: 'updated_timestamp',
    type: 'bigint',
    default: () => 'FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)',
  })
  updatedTimestamp: number;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted?: boolean;
}

