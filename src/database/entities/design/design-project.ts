import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../assets/base-asset';
import { AssetType } from '@inf-monkeys/monkeys';

@Entity({ name: 'design_project' })
export class DesignProjectEntity extends BaseAssetEntity {
  assetType: AssetType = 'design-project';
  
  public getAssetId() {
    return this.projectId;
  }

  @Column({
    name: 'project_id',
    nullable: false,
  })
  projectId: string;

  @Column({
    type: 'integer',
    nullable: false,
    default: 1,
  })
  version: number;

  @Column({
    name: 'sort_index',
    type: 'integer',
    nullable: true,
  })
  sortIndex: number;

  @Column({
    name: 'is_template',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isTemplate: boolean;
}
