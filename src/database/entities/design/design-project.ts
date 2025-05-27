import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../assets/base-asset';

@Entity({ name: 'design_project' })
export class DesignProjectEntity extends BaseAssetEntity {
  @Column({
    name: 'sort_index',
    type: 'integer',
  })
  sortIndex: number;
}
