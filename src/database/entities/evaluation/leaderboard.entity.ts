import { Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { EvaluationModuleEntity } from './evaluation-module.entity';

@Entity({ name: 'leaderboards' })
export class LeaderboardEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  id: string;

  @OneToOne(() => EvaluationModuleEntity, (module) => module.leaderboard)
  evaluationModule: EvaluationModuleEntity;
}
