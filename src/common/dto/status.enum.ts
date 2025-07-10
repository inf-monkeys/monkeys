export enum WorkflowStatusEnum {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
  TERMINATED = 'TERMINATED',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',

  // UNKNOWN
  UNKNOWN = 'UNKNOWN',
}

export enum ConversationStatusEnum {
  SUCCEED = 'SUCCEED',
  FAILED = 'FAILED',
}
