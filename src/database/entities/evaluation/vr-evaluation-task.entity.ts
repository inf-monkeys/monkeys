import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../base/base';

export enum VRTaskStatus {
  PENDING = 'pending', // 待评测
  COMPLETED = 'completed', // 已完成评测
}

@Entity({ name: 'vr_evaluation_tasks' })
@Index(['teamId'])
@Index(['status'])
@Index(['teamId', 'status'])
export class VREvaluationTaskEntity extends BaseEntity {
  @Column({ name: 'team_id' })
  teamId: string;

  @Column({ name: 'task_name', type: 'varchar', length: 500 })
  taskName: string; // 例如："一个家用扫地机器人"

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string; // 模型缩略图的在线链接

  @Column({ name: 'model_url', type: 'text' })
  modelUrl: string; // 模型文件的在线链接（USDZ格式）

  @Column({ type: 'enum', enum: VRTaskStatus, default: VRTaskStatus.PENDING })
  status: VRTaskStatus;

  @Column({ name: 'evaluation_result', type: 'jsonb', nullable: true })
  evaluationResult?: {
    score_1: number; // 外观美观度
    score_2: number; // 材质/做工质量
    score_3: number; // 使用舒适度
    score_4: number; // 操作便利性
    score_5: number; // 功能满足需求
    score_6: number; // 功能使用高效
    score_7: number; // 结实耐用性
    score_8: number; // 使用安全性
    score_9: number; // 模型的几何质量分数
    score_10: number; // 模型的纹理质量分数
  };

  @Column({ name: 'evaluated_at', type: 'timestamp', nullable: true })
  evaluatedAt?: Date; // 评测完成时间

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string; // 创建者 user_id
}
