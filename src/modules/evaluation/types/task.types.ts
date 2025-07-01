export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskType {
  EVALUATE_BATTLE_GROUP = 'evaluate_battle_group',
  ADD_ASSETS_TO_MODULE = 'add_assets_to_module',
}

export interface EvaluationTask {
  id: string;
  type: TaskType;
  moduleId: string;
  teamId: string;
  userId: string;
  status: TaskStatus;
  progress: TaskProgress;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;

  // Different task types will have different payloads
  payload: {
    battleGroupId?: string;
    assetIds?: string[];
    [key: string]: any;
  };
}

export interface TaskProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  percentage: number;
}

export interface TaskResult {
  taskId: string;
  battleGroupId: string;
  totalBattles: number;
  completedBattles: number;
  failedBattles: number;
  results: Array<{
    battleId: string;
    winner: 'A' | 'B' | 'draw';
    error?: string;
  }>;
}
