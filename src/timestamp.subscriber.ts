import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { BaseEntity } from './database/entities/base/base';

@EventSubscriber()
export class TimestampSubscriber implements EntitySubscriberInterface<BaseEntity> {
  listenTo() {
    return BaseEntity;
  }

  beforeInsert(event: InsertEvent<BaseEntity>) {
    if (event.entity) {
      const now = Date.now();

      if (event.entity.createdTimestamp === undefined) {
        event.entity.createdTimestamp = now;
      }

      if (event.entity.updatedTimestamp === undefined) {
        event.entity.updatedTimestamp = now;
      }
    }
  }
}
