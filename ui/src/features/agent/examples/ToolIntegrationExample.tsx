/**
 * Example: How to use the Agent Tool System with assistant-ui
 *
 * This file demonstrates how to integrate the tool system in your application.
 */

import { AgentRuntimeProvider } from './components/AgentRuntimeProvider';
import { Thread } from '@/components/assistant-ui/thread';

/**
 * Basic Usage Example
 *
 * The simplest way to use the agent with tool support.
 * Tool UI components are automatically registered inside AgentRuntimeProvider.
 */
export function BasicAgentExample() {
  const teamId = 'team_123';
  const userId = 'user_456';
  const agentId = 'agent_789';

  return (
    <div className="h-screen">
      <AgentRuntimeProvider
        teamId={teamId}
        userId={userId}
        agentId={agentId}
      >
        {/* The Thread component will automatically display tool calls */}
        <Thread />
      </AgentRuntimeProvider>
    </div>
  );
}

/**
 * Adding Custom Tool UIs
 *
 * To add a new tool UI, create it in ToolUIs.tsx and register it
 * in AgentRuntimeProvider.
 */

// Step 1: Create the tool UI component in ToolUIs.tsx
/*
import { makeAssistantToolUI } from '@assistant-ui/react';

export const ImageGenerationToolUI = makeAssistantToolUI<
  { prompt: string; style?: string },
  { imageUrl: string; metadata: any }
>({
  toolName: 'generate_image',
  render: ({ args, result, status }) => {
    if (status.type === 'running') {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin" />
              <div>
                <p className="font-medium">Generating image</p>
                <p className="text-sm text-muted-foreground">
                  Prompt: "{args.prompt}"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (result) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>{args.prompt}</CardDescription>
          </CardHeader>
          <CardContent>
            <img
              src={result.imageUrl}
              alt={args.prompt}
              className="w-full rounded-lg"
            />
          </CardContent>
        </Card>
      );
    }

    return null;
  },
});
*/

// Step 2: Import and register in AgentRuntimeProvider.tsx
/*
import {
  ApprovalToolUI,
  WebSearchToolUI,
  CalculatorToolUI,
  ImageGenerationToolUI, // <-- Add your new tool UI
} from './ToolUIs';

// Inside the return statement:
// <AssistantRuntimeProvider runtime={runtime}>
//   <TooltipProvider>
//     <ApprovalToolUI />
//     <WebSearchToolUI />
//     <CalculatorToolUI />
//     <ImageGenerationToolUI />
//     {children}
//   </TooltipProvider>
// </AssistantRuntimeProvider>
*/

/**
 * Tool Configuration in AgentConfig
 *
 * Use the AgentConfig component to enable tools for an agent.
 */
export function CreateAgentWithToolsExample() {
  const teamId = 'team_123';
  const agentId = 'agent_789';

  const handleSaveConfig = (config) => {
    console.log('Saving agent config:', config);
    // config.tools.enabled = true
    // config.tools.toolNames = ['web_search', 'calculator', 'generate_image']

    // Save to backend...
  };

  return (
    <AgentConfig
      teamId={teamId}
      agentId={agentId}
      onSave={handleSaveConfig}
    />
  );
}

/**
 * Accessing Tool Data via API
 *
 * Use the toolApi to interact with tool data.
 */
export function ToolDataExample() {
  const teamId = 'team_123';
  const threadId = 'thread_456';

  const { data: tools } = useToolList(teamId);
  const { data: toolCalls } = useToolCalls(threadId, teamId);
  const { data: pendingCalls } = usePendingToolCalls(threadId, teamId);
  const { data: stats } = useToolCallStats(teamId, 'day');

  return (
    <div>
      <h2>Available Tools</h2>
      <ul>
        {tools?.map((tool) => (
          <li key={tool.id}>
            {tool.name} - {tool.description}
            {tool.needsApproval && ' (Requires Approval)'}
          </li>
        ))}
      </ul>

      <h2>Recent Tool Calls</h2>
      <ul>
        {toolCalls?.map((call) => (
          <li key={call.id}>
            {call.toolName} - Status: {call.status}
          </li>
        ))}
      </ul>

      <h2>Tool Statistics</h2>
      <p>Total calls today: {stats?.totalCalls}</p>
      <p>Success rate: {((stats?.successCount / stats?.totalCalls) * 100).toFixed(1)}%</p>
    </div>
  );
}

/**
 * Custom Compact Mode with Tools
 *
 * Use compact mode for embedded agent interfaces.
 */
export function CompactAgentWithToolsExample() {
  return (
    <div className="w-96 h-[600px] border rounded-lg">
      <AgentRuntimeProvider
        teamId="team_123"
        userId="user_456"
        mode="compact"
        modeConfig={{
          isCompactMode: true,
        }}
      >
        <Thread />
      </AgentRuntimeProvider>
    </div>
  );
}

/**
 * Tool Approval Workflow
 *
 * The approval workflow is automatic:
 * 1. Backend marks tool as needsApproval
 * 2. Frontend ApprovalToolUI detects status.type === 'requires-action'
 * 3. User clicks Approve/Reject
 * 4. Frontend calls toolApi.approveToolCall()
 * 5. Backend continues or cancels execution
 * 6. Result is displayed
 */

/**
 * Understanding Tool Fallback
 *
 * If a tool doesn't have a custom UI (created with makeAssistantToolUI),
 * assistant-ui will use the ToolFallback component to display it.
 *
 * The ToolFallback shows:
 * - Tool name
 * - Input arguments (collapsible)
 * - Output result (collapsible)
 * - Execution status
 *
 * This is configured in thread.tsx:
 */
/*
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: { Fallback: ToolFallback },
  }}
/>
*/

/**
 * Best Practices
 *
 * 1. Create custom UIs for frequently used tools
 * 2. Use ToolFallback for rarely used or simple tools
 * 3. Always handle all tool status types (running, error, complete)
 * 4. Provide clear visual feedback during execution
 * 5. Make approval UIs obvious and easy to use
 */
