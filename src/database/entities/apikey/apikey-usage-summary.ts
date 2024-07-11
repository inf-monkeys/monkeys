import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'apikey_usage_summary' })
@Index(['teamId', 'apiKey', 'date'])
export class ApiKeyUsagaSummaryEntity extends BaseEntity {
  @Column({
    name: 'team_id',
  })
  teamId: string;

  @Column({
    name: 'api_key',
  })
  apiKey: string;

  @Column({
    name: 'date',
  })
  date: string;

  @Column({
    name: 'data',
    type: 'simple-json',
  })
  data: { [key: string]: number };
}
