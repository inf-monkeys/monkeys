import { TimestampTransformer } from '@/database/transformers/timestamp.transformer';
import { Column, PrimaryColumn } from 'typeorm';

export class BaseEntity {
  @PrimaryColumn({
    type: 'varchar',
    length: 128,
  })
  id: string;

  @Column({
    name: 'created_timestamp',
    type: 'timestamp',
    transformer: TimestampTransformer,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdTimestamp: number;

  @Column({
    name: 'updated_timestamp',
    type: 'timestamp',
    transformer: TimestampTransformer,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedTimestamp: number;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted?: boolean;
}
