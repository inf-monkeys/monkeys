import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

@Entity({ name: 'evaluation_rating_history' })
@Index(['evaluationModuleId', 'assetId', 'battleId'], { unique: true })
export class EvaluationRatingHistoryEntity extends BaseEntity {
  @Column({ name: 'evaluation_module_id' })
  evaluationModuleId: string;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ name: 'battle_id' })
  battleId: string;

  @Column({ type: 'float', name: 'mu_before' })
  muBefore: number;

  @Column({ type: 'float', name: 'mu_after' })
  muAfter: number;

  @Column({ type: 'float', name: 'sigma_before' })
  sigmaBefore: number;

  @Column({ type: 'float', name: 'sigma_after' })
  sigmaAfter: number;

  @Column({ type: 'float', name: 'rating_before' })
  ratingBefore: number;

  @Column({ type: 'float', name: 'rating_after' })
  ratingAfter: number;

  @Column({ type: 'float', name: 'rating_change' })
  ratingChange: number;
}
