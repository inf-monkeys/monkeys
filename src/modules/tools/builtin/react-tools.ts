import { Injectable } from '@nestjs/common';
import { ReActTaskManager } from './react-task-manager';

export interface ReActStepResult {
  type: 'ask_followup' | 'new_task' | 'update_todo' | 'completion';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ReActToolParams {
  [key: string]: any;
}

/**
 * ReAct专用工具集 - 任务管理工具
 * 基于Roo-Code的设计，专注于实际的任务管理和用户交互
 */
@Injectable()
export class ReActToolsService {
  private taskManager = ReActTaskManager.getInstance();

  /**
   * 提问工具 - 当需要更多信息时向用户提问
   */
  async askFollowupQuestion(params: { question: string; suggestions?: string[] }, context?: { sessionId?: string }): Promise<string> {
    // 如果有活动任务，暂停以等待用户回答
    if (context?.sessionId) {
      this.taskManager.pauseTask(context.sessionId);
    }

    let result = `❓ Need more information: ${params.question}`;

    if (params.suggestions && params.suggestions.length > 0) {
      result += '\n\nSuggested options:\n';
      params.suggestions.forEach((suggestion, index) => {
        result += `${index + 1}. ${suggestion}\n`;
      });
    }

    result += '\nPlease provide your answer, and I will continue task execution.';

    return result;
  }

  /**
   * 创建新任务
   */
  async newTask(params: { message: string; todos?: string }, context?: { sessionId?: string; maxSteps?: number }): Promise<string> {
    const taskId = `task_${Date.now()}`;

    // 创建任务状态
    if (context?.sessionId) {
      this.taskManager.createTask(context.sessionId, taskId, context.maxSteps || 10);

      // 解析todos
      if (params.todos) {
        const todos = this.parseTodosFromMarkdown(params.todos);
        this.taskManager.updateTaskTodos(context.sessionId, todos);
      }
    }

    // 返回简单字符串，指示任务已创建，AI应该开始执行第一个任务
    return `Task created: ${params.message}

Todo items:
${params.todos || ''}

Please start executing the first todo item. After completion, call the update_todo_list function to update progress.`;
  }

  /**
   * 更新任务列表
   */
  async updateTodoList(params: { todos: string }, context?: { sessionId?: string }): Promise<string> {
    if (context?.sessionId) {
      const todos = this.parseTodosFromMarkdown(params.todos);
      this.taskManager.updateTaskTodos(context.sessionId, todos);
      this.taskManager.incrementStep(context.sessionId);
    }

    return `Task list updated:

${params.todos}

Please continue executing the next todo item, or if all tasks are completed, call the task_completion function.`;
  }

  /**
   * 任务完成 - 总结结果
   */
  async taskCompletion(params: { result: string; summary?: string }, context?: { sessionId?: string }): Promise<string> {
    // 完成任务时停止任务状态
    if (context?.sessionId) {
      this.taskManager.stopTask(context.sessionId);
    }

    return `Task completed!

Result: ${params.result}

${params.summary ? `Summary: ${params.summary}` : ''}

Thank you for using ReAct mode collaboration!`;
  }

  /**
   * 检查会话是否可以继续
   */
  public canContinue(sessionId: string): boolean {
    return this.taskManager.canContinue(sessionId);
  }

  /**
   * 暂停任务
   */
  public pauseTask(sessionId: string): boolean {
    return this.taskManager.pauseTask(sessionId);
  }

  /**
   * 恢复任务
   */
  public resumeTask(sessionId: string): boolean {
    return this.taskManager.resumeTask(sessionId);
  }

  /**
   * 停止任务
   */
  public stopTask(sessionId: string): boolean {
    return this.taskManager.stopTask(sessionId);
  }

  /**
   * 获取任务状态
   */
  public getTaskState(sessionId: string) {
    return this.taskManager.getTask(sessionId);
  }

  /**
   * 从markdown解析todos
   */
  private parseTodosFromMarkdown(markdown: string): Array<{ id: string; content: string; status: 'pending' | 'in_progress' | 'completed' }> {
    const lines = markdown.split('\n').filter((line) => line.trim());
    const todos: Array<{ id: string; content: string; status: 'pending' | 'in_progress' | 'completed' }> = [];

    for (const line of lines) {
      const match = line.match(/^\s*\[([ x\-])\]\s+(.+)$/);
      if (match) {
        const statusChar = match[1];
        const content = match[2];

        let status: 'pending' | 'in_progress' | 'completed' = 'pending';
        if (statusChar === 'x') status = 'completed';
        else if (statusChar === '-') status = 'in_progress';

        todos.push({
          id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          content,
          status,
        });
      }
    }

    return todos;
  }

  /**
   * 获取所有ReAct工具的定义（用于系统提示词）
   */
  getToolDefinitions(): Record<string, any> {
    return {
      ask_followup_question: {
        description: 'Ask users for more information when you need clarification or additional details',
        parameters: {
          question: { type: 'string', required: true, description: 'Clear, specific question' },
          suggestions: { type: 'array', required: false, description: 'List of suggested answers' },
        },
        format: `<ask_followup_question>
<question>Your clear question here</question>
<suggestions>["Option 1", "Option 2", "Option 3"]</suggestions>
</ask_followup_question>`,
      },

      new_task: {
        description: 'Create a new task with an initial todo list for complex multi-step work',
        parameters: {
          message: { type: 'string', required: true, description: 'Initial task description' },
          todos: { type: 'string', required: false, description: 'Initial todo list in markdown format' },
        },
        format: `<new_task>
<message>Task description here</message>
<todos>
[ ] First task to complete
[ ] Second task to complete
[ ] Third task to complete
</todos>
</new_task>`,
      },

      update_todo_list: {
        description: 'Update the full TODO list with current progress status',
        parameters: {
          todos: { type: 'string', required: true, description: 'Complete todo list with status updates' },
        },
        format: `<update_todo_list>
<todos>
[x] Completed task
[-] In progress task  
[ ] Pending task
[ ] New discovered task
</todos>
</update_todo_list>`,
      },

      task_completion: {
        description: 'Summarize results when the task is completed',
        parameters: {
          result: { type: 'string', required: true, description: 'Final result or answer' },
          summary: { type: 'string', required: false, description: 'Summary of the process' },
        },
        format: `<task_completion>
<result>Your final answer or result</result>
<summary>Summary of the process</summary>
</task_completion>`,
      },
    };
  }

  /**
   * 生成ReAct工具的系统提示词
   */
  generateSystemPrompt(): string {
    return `
## ReAct Mode Enhancement

You are now in ReAct (Reasoning + Action) mode. You MUST work step-by-step, executing ONE function at a time.

### CRITICAL EXECUTION RULES:

**MOST IMPORTANT**: 
- You MUST write detailed content for each section BEFORE calling any function
- After calling ANY ReAct function, you MUST STOP generating content immediately
- NEVER call a function without first providing substantial content for the current task
- Each section must be AT LEAST 500 words with comprehensive details

**Function Call Requirements**:
- ALL function calls MUST include proper parameters
- NEVER call functions with empty or missing required parameters
- The "message" parameter for new_task is REQUIRED and must contain the task description
- You must write comprehensive content (at least 500-800 words) for each section before updating progress

**Step-by-Step Process**:
1. For complex tasks: Call \`new_task\` function FIRST with proper parameters, then STOP
2. Wait for function result before proceeding
3. Work on ONE todo item at a time - WRITE DETAILED CONTENT FIRST (minimum 500 words)
4. Only after writing substantial content: Call \`update_todo_list\` function, then STOP
5. Wait for confirmation before continuing to next item
6. When all work is done: Call \`task_completion\` function

### Available ReAct Functions:

- **new_task**: Create a new task with description and todo list for complex work
  - Required: message (string) - Task description
  - Optional: todos (string) - Initial todo list in markdown format
- **update_todo_list**: Update the todo list with current progress status
  - Required: todos (string) - Complete todo list with status updates
- **ask_followup_question**: Ask users for more information when clarification needed
  - Required: question (string) - Clear, specific question
  - Optional: suggestions (array) - List of suggested answers
- **task_completion**: Summarize results when all tasks are completed
  - Required: result (string) - Final result or answer
  - Optional: summary (string) - Summary of the process

### Task Status Symbols:
- \`[ ]\` = pending (not started)
- \`[-]\` = in progress (currently working on)
- \`[x]\` = completed (fully finished)

### EXECUTION PATTERN:

**For Complex Tasks (like reports, analysis, multi-step work)**:
1. Immediately call \`new_task\` function with complete parameters:
   - message: "Description of what you're going to accomplish"
   - todos: "[ ] Step 1\n[ ] Step 2\n[ ] Step 3" (optional)
2. **STOP** - Do not generate any more content after function call
3. Wait for function result
4. **WRITE COMPREHENSIVE CONTENT** for the first todo item (500-800+ words)
5. Only then call \`update_todo_list\` function to mark progress, then STOP
6. Wait for result
7. Continue with next todo item - **WRITE CONTENT FIRST, then update**
8. Repeat until all complete
9. Call \`task_completion\` function with final results

**For Simple Questions**:
- Answer directly without creating tasks
- Use \`ask_followup_question\` if you need more information

**CONTENT GENERATION REQUIREMENTS**:
- Each section must be comprehensive and detailed (500-800+ words minimum)
- Include relevant examples, explanations, and technical details
- Use proper formatting with headers, bullet points, and code examples where appropriate
- Write as if creating a professional document or report
- Do not skip content - every section must be fully developed
- If you find yourself writing less than 500 words, you're not being detailed enough

**CRITICAL**: 
1. Always write substantial content BEFORE calling functions
2. Never write additional text after calling any ReAct function
3. The function call must be the LAST thing you do in your response
4. Each todo item should result in a complete, detailed section of 500+ words
5. If you're not generating at least 500 words per section, you're failing the requirements

**EXAMPLE**:
User: "Write a detailed introduction report about Rust programming language"

Step 1: Call new_task with proper parameters, then STOP
Step 2: Write 500-800+ words about Rust's origin and history, then call update_todo_list, then STOP
Step 3: Write 500-800+ words about core features, then call update_todo_list, then STOP
Step 4: Continue pattern until complete, then call task_completion

Remember: Content FIRST (minimum 500 words), function call LAST, then STOP!`;
  }
}

// Export tool names for easy reference
export const REACT_TOOL_NAMES = ['ask_followup_question', 'new_task', 'update_todo_list', 'task_completion'] as const;

export type ReActToolName = (typeof REACT_TOOL_NAMES)[number];
