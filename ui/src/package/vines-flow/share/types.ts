declare type TaskDef = {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name: string;
  description?: string;
  retryCount?: number;
  timeoutSeconds: number;
  inputKeys?: Array<string>;
  outputKeys?: Array<string>;
  timeoutPolicy?: 'RETRY' | 'TIME_OUT_WF' | 'ALERT_ONLY';
  retryLogic?: 'FIXED' | 'EXPONENTIAL_BACKOFF' | 'LINEAR_BACKOFF';
  retryDelaySeconds?: number;
  responseTimeoutSeconds?: number;
  concurrentExecLimit?: number;
  inputTemplate?: Record<string, any>;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  isolationGroupId?: string;
  executionNameSpace?: string;
  ownerEmail?: string;
  pollTimeoutSeconds?: number;
  backoffScaleFactor?: number;
};

declare type SubWorkflowParams = {
  name: string;
  version?: number;
  taskToDomain?: Record<string, string>;
  workflowDefinition?: WorkflowDef$1;
};

declare type WorkflowTask = {
  name: string;
  taskReferenceName: string;
  description?: string;
  inputParameters?: Record<string, any>;
  type?: string;
  dynamicTaskNameParam?: string;
  /**
   * @deprecated
   */
  caseValueParam?: string;
  /**
   * @deprecated
   */
  caseExpression?: string;
  scriptExpression?: string;
  decisionCases?: Record<string, Array<WorkflowTask>>;
  /**
   * @deprecated
   */
  dynamicForkJoinTasksParam?: string;
  dynamicForkTasksParam?: string;
  dynamicForkTasksInputParamName?: string;
  defaultCase?: Array<WorkflowTask>;
  forkTasks?: Array<Array<WorkflowTask>>;
  startDelay?: number;
  subWorkflowParam?: SubWorkflowParams;
  joinOn?: Array<string>;
  sink?: string;
  optional?: boolean;
  taskDefinition?: TaskDef;
  rateLimited?: boolean;
  defaultExclusiveJoinTask?: Array<string>;
  asyncComplete?: boolean;
  loopCondition?: string;
  loopOver?: Array<WorkflowTask>;
  retryCount?: number;
  evaluatorType?: string;
  expression?: string;
  workflowTaskType?:
    | 'SIMPLE'
    | 'DYNAMIC'
    | 'FORK_JOIN'
    | 'FORK_JOIN_DYNAMIC'
    | 'DECISION'
    | 'SWITCH'
    | 'JOIN'
    | 'DO_WHILE'
    | 'SUB_WORKFLOW'
    | 'START_WORKFLOW'
    | 'EVENT'
    | 'WAIT'
    | 'HUMAN'
    | 'USER_DEFINED'
    | 'HTTP'
    | 'LAMBDA'
    | 'INLINE'
    | 'EXCLUSIVE_JOIN'
    | 'TERMINATE'
    | 'KAFKA_PUBLISH'
    | 'JSON_JQ_TRANSFORM'
    | 'SET_VARIABLE';
};

declare type WorkflowDef$1 = {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  name: string;
  description?: string;
  version?: number;
  tasks: Array<WorkflowTask>;
  inputParameters?: Array<string>;
  outputParameters?: Record<string, any>;
  failureWorkflow?: string;
  schemaVersion?: number;
  restartable?: boolean;
  workflowStatusListenerEnabled?: boolean;
  ownerEmail?: string;
  timeoutPolicy?: 'TIME_OUT_WF' | 'ALERT_ONLY';
  timeoutSeconds: number;
  variables?: Record<string, any>;
  inputTemplate?: Record<string, any>;
};

declare type Task = {
  taskType?: string;
  status?:
    | 'IN_PROGRESS'
    | 'CANCELED'
    | 'FAILED'
    | 'FAILED_WITH_TERMINAL_ERROR'
    | 'COMPLETED'
    | 'COMPLETED_WITH_ERRORS'
    | 'SCHEDULED'
    | 'TIMED_OUT'
    | 'SKIPPED';
  inputData?: Record<string, any>;
  referenceTaskName?: string;
  retryCount?: number;
  seq?: number;
  correlationId?: string;
  pollCount?: number;
  taskDefName?: string;
  scheduledTime?: number;
  startTime?: number;
  endTime?: number;
  updateTime?: number;
  startDelayInSeconds?: number;
  retriedTaskId?: string;
  retried?: boolean;
  executed?: boolean;
  callbackFromWorker?: boolean;
  responseTimeoutSeconds?: number;
  workflowInstanceId?: string;
  workflowType?: string;
  taskId?: string;
  reasonForIncompletion?: string;
  callbackAfterSeconds?: number;
  workerId?: string;
  outputData?: Record<string, any>;
  workflowTask?: WorkflowTask;
  domain?: string;
  rateLimitPerFrequency?: number;
  rateLimitFrequencyInSeconds?: number;
  externalInputPayloadStoragePath?: string;
  externalOutputPayloadStoragePath?: string;
  workflowPriority?: number;
  executionNameSpace?: string;
  isolationGroupId?: string;
  iteration?: number;
  subWorkflowId?: string;
  subworkflowChanged?: boolean;
  queueWaitTime?: number;
  taskDefinition?: TaskDef;
  loopOverTask?: boolean;
};

declare type Workflow = {
  ownerApp?: string;
  createTime?: number;
  updateTime?: number;
  createdBy?: string;
  updatedBy?: string;
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'TERMINATED' | 'PAUSED';
  endTime?: number;
  workflowId?: string;
  parentWorkflowId?: string;
  parentWorkflowTaskId?: string;
  tasks?: Array<Task>;
  input?: Record<string, any>;
  output?: Record<string, any>;
  correlationId?: string;
  reRunFromWorkflowId?: string;
  reasonForIncompletion?: string;
  event?: string;
  taskToDomain?: Record<string, string>;
  failedReferenceTaskNames?: Array<string>;
  workflowDefinition?: WorkflowDef$1;
  externalInputPayloadStoragePath?: string;
  externalOutputPayloadStoragePath?: string;
  priority?: number;
  variables?: Record<string, any>;
  lastRetriedTime?: number;
  startTime?: number;
  workflowVersion?: number;
  workflowName?: string;
};

interface CommonTaskDef {
  name: string;
  taskReferenceName: string;
}
export enum TaskType {
  START = 'START',
  SIMPLE = 'SIMPLE',
  DYNAMIC = 'DYNAMIC',
  FORK_JOIN = 'FORK_JOIN',
  FORK_JOIN_DYNAMIC = 'FORK_JOIN_DYNAMIC',
  DECISION = 'DECISION',
  SWITCH = 'SWITCH',
  JOIN = 'JOIN',
  DO_WHILE = 'DO_WHILE',
  SUB_WORKFLOW = 'SUB_WORKFLOW',
  EVENT = 'EVENT',
  WAIT = 'WAIT',
  USER_DEFINED = 'USER_DEFINED',
  HTTP = 'HTTP',
  LAMBDA = 'LAMBDA',
  INLINE = 'INLINE',
  EXCLUSIVE_JOIN = 'EXCLUSIVE_JOIN',
  TERMINAL = 'TERMINAL',
  TERMINATE = 'TERMINATE',
  KAFKA_PUBLISH = 'KAFKA_PUBLISH',
  JSON_JQ_TRANSFORM = 'JSON_JQ_TRANSFORM',
  SET_VARIABLE = 'SET_VARIABLE',
}
declare type TaskDefTypes =
  | SimpleTaskDef
  | DoWhileTaskDef
  | EventTaskDef
  | ForkJoinTaskDef
  | ForkJoinDynamicDef
  | HttpTaskDef
  | InlineTaskDef
  | JsonJQTransformTaskDef
  | KafkaPublishTaskDef
  | SetVariableTaskDef
  | SubWorkflowTaskDef
  | SwitchTaskDef
  | TerminateTaskDef
  | JoinTaskDef
  | WaitTaskDef;
interface DoWhileTaskDef extends CommonTaskDef {
  inputParameters: Record<string, unknown>;
  type: TaskType.DO_WHILE;
  startDelay?: number;
  optional?: boolean;
  asyncComplete?: boolean;
  loopCondition: string;
  loopOver: TaskDefTypes[];
}
interface EventTaskDef extends CommonTaskDef {
  type: TaskType.EVENT;
  sink: string;
  asyncComplete?: boolean;
}
interface ForkJoinTaskDef extends CommonTaskDef {
  type: TaskType.FORK_JOIN;
  inputParameters?: Record<string, string>;
  forkTasks: Array<Array<TaskDefTypes>>;
}
interface JoinTaskDef extends CommonTaskDef {
  type: TaskType.JOIN;
  inputParameters?: Record<string, string>;
  joinOn: string[];
  optional?: boolean;
  asyncComplete?: boolean;
}
interface ForkJoinDynamicDef extends CommonTaskDef {
  inputParameters: {
    dynamicTasks: any;
    dynamicTasksInput: any;
  };
  type: TaskType.FORK_JOIN_DYNAMIC;
  dynamicForkTasksParam: string;
  dynamicForkTasksInputParamName: string;
  startDelay?: number;
  optional?: boolean;
  asyncComplete?: boolean;
}
interface HttpInputParameters {
  uri: string;
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
  accept?: string;
  contentType?: string;
  headers?: Record<string, string>;
  body?: unknown;
  connectionTimeOut?: number;
  readTimeOut?: string;
}
interface HttpTaskDef extends CommonTaskDef {
  inputParameters: {
    [x: string]: unknown;
    http_request: HttpInputParameters;
  };
  type: TaskType.HTTP;
}
interface InlineTaskInputParameters {
  evaluatorType: 'javascript' | 'graaljs';
  expression: string;
  [x: string]: unknown;
}
interface InlineTaskDef extends CommonTaskDef {
  type: TaskType.INLINE;
  inputParameters: InlineTaskInputParameters;
}
interface ContainingQueryExpression {
  queryExpression: string;
  [x: string | number | symbol]: unknown;
}
interface JsonJQTransformTaskDef extends CommonTaskDef {
  type: TaskType.JSON_JQ_TRANSFORM;
  inputParameters: ContainingQueryExpression;
}
interface KafkaPublishInputParameters {
  topic: string;
  value: string;
  bootStrapServers: string;
  headers: Record<string, string>;
  key: string;
  keySerializer: string;
}
interface KafkaPublishTaskDef extends CommonTaskDef {
  inputParameters: {
    kafka_request: KafkaPublishInputParameters;
  };
  type: TaskType.KAFKA_PUBLISH;
}
interface SetVariableTaskDef extends CommonTaskDef {
  type: TaskType.SET_VARIABLE;
  inputParameters: Record<string, unknown>;
}
interface SimpleTaskDef extends CommonTaskDef {
  type: TaskType.SIMPLE;
  inputParameters?: Record<string, unknown>;
}
interface SubWorkflowTaskDef extends CommonTaskDef {
  type: TaskType.SUB_WORKFLOW;
  inputParameters?: Record<string, unknown>;
  subWorkflowParam: {
    name: string;
    version?: number;
    taskToDomain?: Record<string, string>;
  };
}
interface SwitchTaskDef extends CommonTaskDef {
  inputParameters: Record<string, unknown>;
  type: TaskType.SWITCH;
  decisionCases: Record<string, TaskDefTypes[]>;
  defaultCase: TaskDefTypes[];
  evaluatorType: 'value-param' | 'javascript';
  expression: string;
}
interface TerminateTaskDef extends CommonTaskDef {
  inputParameters: {
    terminationStatus: 'COMPLETED' | 'FAILED';
    workflowOutput?: Record<string, string>;
    terminationReason?: string;
  };
  type: TaskType.TERMINATE;
  startDelay?: number;
  optional?: boolean;
}
interface WaitTaskDef extends CommonTaskDef {
  type: TaskType.WAIT;
  inputParameters: {
    duration?: string;
    until?: string;
  };
}

interface WorkflowDef extends Omit<WorkflowDef$1, 'tasks' | 'version' | 'inputParameters'> {
  inputParameters: string[];
  version: number;
  tasks: TaskDefTypes[];
}

declare type TaskDefTypesGen =
  | SimpleTaskDef
  | DoWhileTaskDefGen
  | EventTaskDef
  | ForkJoinTaskDefGen
  | ForkJoinDynamicDef
  | HttpTaskDef
  | InlineTaskDefGen
  | JsonJQTransformTaskDef
  | KafkaPublishTaskDef
  | SetVariableTaskDef
  | SubWorkflowTaskDef
  | SwitchTaskDefGen
  | TerminateTaskDef
  | JoinTaskDef
  | WaitTaskDef;

declare type ForkJoinTaskDefGen = Omit<ForkJoinTaskDef, 'forkTasks'> & {
  forkTasks: Array<Array<Partial<TaskDefTypesGen>>>;
};
declare type SwitchTaskDefGen = Omit<SwitchTaskDef, 'decisionCases' | 'defaultCase'> & {
  decisionCases: Record<string, Partial<TaskDefTypesGen>[]>;
  defaultCase: Partial<TaskDefTypesGen>[];
};
declare type DoWhileTaskDefGen = Omit<DoWhileTaskDef, 'loopOver'> & {
  loopOver: Partial<TaskDefTypesGen>[];
};
interface InlineTaskInputParametersGen extends Omit<InlineTaskInputParameters, 'expression'> {
  expression: string | Function;
}
interface InlineTaskDefGen extends Omit<InlineTaskDef, 'inputParameters'> {
  inputParameters: InlineTaskInputParametersGen;
}

export type {
  CommonTaskDef,
  DoWhileTaskDef,
  EventTaskDef,
  ForkJoinDynamicDef,
  ForkJoinTaskDef,
  HttpInputParameters,
  HttpTaskDef,
  InlineTaskDef,
  InlineTaskInputParameters,
  JoinTaskDef,
  JsonJQTransformTaskDef,
  KafkaPublishInputParameters,
  KafkaPublishTaskDef,
  SetVariableTaskDef,
  SimpleTaskDef,
  SubWorkflowParams,
  SubWorkflowTaskDef,
  SwitchTaskDef,
  Task,
  TaskDef,
  TaskDefTypes,
  TerminateTaskDef,
  WaitTaskDef,
  Workflow,
  WorkflowDef,
  WorkflowTask,
};
