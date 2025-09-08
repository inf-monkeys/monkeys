import { Injectable } from '@nestjs/common';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  originalLine: string;
}

export interface TaskExecutionState {
  todos: TodoItem[];
  currentTaskIndex: number;
  allCompleted: boolean;
  hasInProgress: boolean;
  hasPending: boolean;
  nextAction: 'continue_task' | 'start_next_task' | 'all_completed' | 'no_tasks';
  actionMessage: string;
}

@Injectable()
export class AgentV2TaskStateManager {
  // Store task state per session
  private sessionTaskStates = new Map<string, TaskExecutionState>();

  /**
   * Parse markdown todo list and extract task state
   */
  public parseTodoList(todosMarkdown: string): TodoItem[] {
    const lines = todosMarkdown
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const todoItems: TodoItem[] = [];
    let idCounter = 1;

    for (const line of lines) {
      // Support both formats: "[x] task" and "- [x] task"
      const match = line.match(/^(?:-\s*)?\[\s*([ xX\-~])\s*\]\s+(.+)$/);
      if (!match) continue;

      let status: 'pending' | 'in_progress' | 'completed' = 'pending';
      if (match[1] === 'x' || match[1] === 'X') status = 'completed';
      else if (match[1] === '-' || match[1] === '~') status = 'in_progress';

      const id = `todo_${idCounter++}`;
      todoItems.push({
        id,
        content: match[2].trim(),
        status,
        originalLine: line,
      });
    }

    return todoItems;
  }

  /**
   * Analyze task execution state and determine next action
   */
  public analyzeTaskState(todos: TodoItem[]): TaskExecutionState {
    const completed = todos.filter((t) => t.status === 'completed');
    const inProgress = todos.filter((t) => t.status === 'in_progress');
    const pending = todos.filter((t) => t.status === 'pending');

    const allCompleted = todos.length > 0 && completed.length === todos.length;
    const hasInProgress = inProgress.length > 0;
    const hasPending = pending.length > 0;

    let nextAction: TaskExecutionState['nextAction'];
    let actionMessage: string;
    let currentTaskIndex = -1;

    if (todos.length === 0) {
      nextAction = 'no_tasks';
      actionMessage = 'No tasks defined. Please create a todo list for complex requests.';
    } else if (allCompleted) {
      nextAction = 'all_completed';
      actionMessage = 'All tasks completed! Use attempt_completion to present the final result.';
      currentTaskIndex = todos.length - 1;
    } else if (hasInProgress) {
      // Find first in-progress task
      currentTaskIndex = todos.findIndex((t) => t.status === 'in_progress');
      nextAction = 'continue_task';
      actionMessage = `Continue working on: "${todos[currentTaskIndex].content}"`;
    } else if (hasPending) {
      // Find first pending task
      currentTaskIndex = todos.findIndex((t) => t.status === 'pending');
      nextAction = 'start_next_task';
      actionMessage = `Start next task: "${todos[currentTaskIndex].content}"`;
    } else {
      nextAction = 'no_tasks';
      actionMessage = 'Unexpected task state. Please review and update the todo list.';
    }

    return {
      todos,
      currentTaskIndex,
      allCompleted,
      hasInProgress,
      hasPending,
      nextAction,
      actionMessage,
    };
  }

  /**
   * Update session task state
   */
  public updateSessionTaskState(sessionId: string, todosMarkdown: string): TaskExecutionState {
    const todos = this.parseTodoList(todosMarkdown);
    const taskState = this.analyzeTaskState(todos);

    this.sessionTaskStates.set(sessionId, taskState);

    return taskState;
  }

  /**
   * Get current task state for session
   */
  public getSessionTaskState(sessionId: string): TaskExecutionState | null {
    return this.sessionTaskStates.get(sessionId) || null;
  }

  /**
   * Generate continuation message based on task state
   */
  public generateContinuationMessage(taskState: TaskExecutionState): string {
    switch (taskState.nextAction) {
      case 'continue_task':
        return `SYSTEM: You must continue working on the current in-progress task: "${taskState.todos[taskState.currentTaskIndex].content}". You MUST use the appropriate tool (web_search for research/information, ask_followup_question for user input, or attempt_completion for final results) to make progress on this specific task. Do not just update the todo list - execute the task using the right tool immediately.`;

      case 'start_next_task':
        return `SYSTEM: You have updated the todo list. Now you must immediately start the next pending task: "${taskState.todos[taskState.currentTaskIndex].content}". You MUST use the appropriate tool (web_search for research/information, ask_followup_question for user input) to begin executing this task. Do not stop after updating - take concrete action on this task immediately.`;

      case 'all_completed':
        return `SYSTEM: All tasks are completed! You must now use the attempt_completion tool to present the final result to the user. Include a comprehensive summary of all completed work.`;

      case 'no_tasks':
        return `SYSTEM: No tasks are defined. For complex requests, you should create a todo list using update_todo_list to break down the work into manageable steps.`;

      default:
        return `SYSTEM: Please continue with the next appropriate action based on the current task state.`;
    }
  }

  /**
   * Check if session should continue execution after tool use
   */
  public shouldContinueExecution(sessionId: string): boolean {
    const taskState = this.getSessionTaskState(sessionId);
    if (!taskState) return false;

    // Continue if there are unfinished tasks
    return taskState.nextAction === 'continue_task' || taskState.nextAction === 'start_next_task' || taskState.nextAction === 'all_completed';
  }

  /**
   * Clear session task state
   */
  public clearSessionTaskState(sessionId: string): void {
    this.sessionTaskStates.delete(sessionId);
  }
}
