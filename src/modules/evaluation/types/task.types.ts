export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface EvaluationTask {
  id: string;
  battleGroupId: string;
  moduleId: string;
  teamId: string;
  userId: string;
  status: TaskStatus;
  progress: TaskProgress;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
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