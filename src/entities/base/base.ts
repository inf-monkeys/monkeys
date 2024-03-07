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
    default: () => +new Date(),
  })
  createdTimestamp: number;

  @Column({
    default: () => +new Date(),
  })
  updatedTimestamp: number;

  @Column({ default: false })
  isDeleted?: boolean;
}
