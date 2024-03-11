import { config } from '@/common/config';
import { ObjectId } from 'mongodb';
import { Column, ObjectIdColumn, PrimaryColumn } from 'typeorm';

const isMongo = config.database.type === 'mongodb';
const IdColumn = isMongo
  ? ObjectIdColumn
  : () =>
      PrimaryColumn({
        type: 'varchar',
        transformer: {
          to: (value: ObjectId) => value?.toHexString(),
          from: (value: string) => new ObjectId(value),
        },
      });

export class BaseEntity {
  @IdColumn()
  id: ObjectId;

  @Column({
    name: 'created_timestamp',
    default: () => Date.now(),
  })
  createdTimestamp: number;

  @Column({
    name: 'updated_timestamp',
    default: () => Date.now(),
  })
  updatedTimestamp: number;

  @Column({ default: false, name: 'is_deleted' })
  isDeleted?: boolean;
}
