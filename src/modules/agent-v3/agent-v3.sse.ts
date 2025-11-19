export type AgentV3SseEvent =
  | {
      type: 'status';
      status: 'processing' | 'done';
      message: string;
      timestamp: number;
    }
  | {
      type: 'thinking';
      phase: 'start' | 'delta' | 'done';
      model_id: string;
      message?: string;
      delta?: string;
      timestamp: number;
    }
  | {
      type: 'content_start';
      message: string;
      guarded: boolean;
      timestamp: number;
    }
  | {
      type: 'content_delta';
      delta: string;
      guarded: boolean;
      timestamp: number;
    }
  | {
      type: 'content_done';
      guarded: boolean;
      timestamp: number;
    }
  | {
      type: 'iteration_info';
      current_iteration: number;
      max_iterations: number;
      message: string;
      timestamp: number;
    }
  | {
      type: 'tool_call';
      tool_call_id: string;
      tool_name: string;
      tool_input: any;
      timestamp: number;
    }
  | {
      type: 'tool_executing';
      tool_call_id: string;
      tool_name: string;
      message: string;
      timestamp: number;
    }
  | {
      type: 'tool_result';
      tool_call_id: string;
      tool_name: string;
      tool_output: any;
      success: boolean;
      timestamp: number;
    }
  | {
      type: 'system_feedback';
      message: string;
      timestamp: number;
    }
  | {
      type: 'retry';
      reason: string;
      retry_count: number;
      max_retries: number;
      message: string;
      timestamp: number;
    }
  | {
      type: 'error';
      error_code: string;
      error_message: string;
      timestamp: number;
    }
  | {
      type: 'done';
      total_duration?: number;
      timestamp: number;
    };

export function sseEvent(data: AgentV3SseEvent): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function nowTs() {
  return Date.now();
}
