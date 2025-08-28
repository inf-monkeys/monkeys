export interface ReActTaskState {
  taskId: string;
  isActive: boolean;
  isPaused: boolean;
  currentStep: number;
  maxSteps: number;
  todos: {
    id: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  createdAt: Date;
  lastUpdatedAt: Date;
}

export class ReActTaskManager {
  private static instance: ReActTaskManager;
  private activeTasks: Map<string, ReActTaskState> = new Map();

  public static getInstance(): ReActTaskManager {
    if (!ReActTaskManager.instance) {
      ReActTaskManager.instance = new ReActTaskManager();
    }
    return ReActTaskManager.instance;
  }

  public createTask(sessionId: string, taskId: string, maxSteps: number = 10): ReActTaskState {
    const task: ReActTaskState = {
      taskId,
      isActive: true,
      isPaused: false,
      currentStep: 0,
      maxSteps,
      todos: [],
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    this.activeTasks.set(sessionId, task);
    return task;
  }

  public getTask(sessionId: string): ReActTaskState | undefined {
    return this.activeTasks.get(sessionId);
  }

  public pauseTask(sessionId: string): boolean {
    const task = this.activeTasks.get(sessionId);
    if (task) {
      task.isPaused = true;
      task.lastUpdatedAt = new Date();
      return true;
    }
    return false;
  }

  public resumeTask(sessionId: string): boolean {
    const task = this.activeTasks.get(sessionId);
    if (task) {
      task.isPaused = false;
      task.lastUpdatedAt = new Date();
      return true;
    }
    return false;
  }

  public stopTask(sessionId: string): boolean {
    const task = this.activeTasks.get(sessionId);
    if (task) {
      task.isActive = false;
      task.isPaused = false;
      task.lastUpdatedAt = new Date();
      this.activeTasks.delete(sessionId);
      return true;
    }
    return false;
  }

  public updateTaskTodos(sessionId: string, todos: ReActTaskState['todos']): boolean {
    const task = this.activeTasks.get(sessionId);
    if (task) {
      task.todos = todos;
      task.lastUpdatedAt = new Date();
      return true;
    }
    return false;
  }

  public incrementStep(sessionId: string): boolean {
    const task = this.activeTasks.get(sessionId);
    if (task && task.currentStep < task.maxSteps) {
      task.currentStep++;
      task.lastUpdatedAt = new Date();
      return true;
    }
    return false;
  }

  public isTaskPaused(sessionId: string): boolean {
    const task = this.activeTasks.get(sessionId);
    return task ? task.isPaused : false;
  }

  public canContinue(sessionId: string): boolean {
    const task = this.activeTasks.get(sessionId);
    return task ? task.isActive && !task.isPaused && task.currentStep < task.maxSteps : false;
  }
}
