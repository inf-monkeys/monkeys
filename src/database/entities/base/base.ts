import { TimestampTransformer } from '@/database/transformers/timestamp.transformer';
import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export class BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 128,
  })
  id: string;

  @CreateDateColumn({
    name: 'created_timestamp',
    type: 'timestamp',
    transformer: TimestampTransformer,
  })
  createdTimestamp: number;

  @UpdateDateColumn({
    name: 'updated_timestamp',
    type: 'timestamp',
    transformer: TimestampTransformer,
  })
  updatedTimestamp: number;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted?: boolean;
}
