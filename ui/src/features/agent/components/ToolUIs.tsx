/**
 * Tool UI Components - Using assistant-ui native patterns
 *
 * This file contains tool UI components created with makeAssistantToolUI.
 * These components provide custom visualization for tool executions.
 */

import { makeAssistantToolUI } from '@assistant-ui/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/utils/index';
import { toolApi } from '../api/agent-api';
import { useAgentContext } from '../contexts/AgentContextProvider';

/**
 * Generic Approval Tool UI
 *
 * This component handles the HITL (Human-in-the-Loop) approval workflow
 * for any tool that requires user approval before execution.
 *
 * The backend tool executor will pause execution and wait for approval.
 * This UI displays the approval request and allows the user to approve/reject.
 */
export const ApprovalToolUI = makeAssistantToolUI<
  Record<string, unknown>,
  unknown
>({
  toolName: '*', // Matches all tools
  render: function ApprovalToolUIRender({
    toolName,
    args,
    argsText,
    result,
    status,
    toolCallId,
  }) {
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get team and user IDs from context
    const { teamId, userId } = useAgentContext();

    const handleApprove = async (approved: boolean) => {
      try {
        setApproving(true);
        setError(null);

        await toolApi.approveToolCall(toolCallId, approved, teamId, userId);

        // The backend will continue execution after approval
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process approval');
      } finally {
        setApproving(false);
      }
    };

    // Show approval UI if status indicates waiting for approval
    // Note: This is a simplified version. In a full implementation,
    // the backend would send a specific status or use the interrupt pattern
    const needsApproval = status.type === 'requires-action';

    if (needsApproval) {
      return (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-600" />
              <CardTitle className="text-lg">Approval Required</CardTitle>
            </div>
            <CardDescription>
              The tool <b>{toolName}</b> requires your approval before execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tool Arguments:
                </p>
                <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
                  {argsText}
                </pre>
              </div>

              {error && (
                <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() => handleApprove(true)}
                  disabled={approving}
                >
                  {approving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleApprove(false)}
                  disabled={approving}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show running state
    if (status.type === 'running') {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium">Executing {toolName}</p>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show error state
    if (status.type === 'incomplete' && status.reason === 'error') {
      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="size-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">
                  Tool execution failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {toolName}: {status.error?.message || 'Unknown error'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show cancelled state
    if (status.type === 'incomplete' && status.reason === 'cancelled') {
      return (
        <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="size-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-200">
                  Tool execution cancelled
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {toolName} was cancelled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Show success state with result
    if (result !== undefined) {
      return (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/10">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5 text-green-600" />
                <p className="font-medium text-green-900 dark:text-green-200">
                  {toolName} completed successfully
                </p>
              </div>

              {result && typeof result === 'object' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Result:
                  </p>
                  <pre className="rounded bg-white dark:bg-gray-950 border p-3 text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Default: show minimal info
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {toolName}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  },
});

/**
 * Example: Custom Tool UI for Web Search
 *
 * This shows how to create a specialized UI for a specific tool.
 */
export const WebSearchToolUI = makeAssistantToolUI<
  { query: string },
  { results: Array<{ title: string; url: string; snippet: string }> }
>({
  toolName: 'web_search',
  render: function WebSearchToolUIRender({ args, result, status }) {
    if (status.type === 'running') {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium">Searching the web</p>
                <p className="text-sm text-muted-foreground">Query: "{args.query}"</p>
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
            <CardTitle className="text-base">
              Search Results for "{args.query}"
            </CardTitle>
            <CardDescription>
              Found {result.results.length} results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.results.map((item, index) => (
                <div key={index} className="rounded border p-3 hover:bg-accent">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {item.title}
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.snippet}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.url}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  },
});

/**
 * Example: Calculator Tool UI
 */
export const CalculatorToolUI = makeAssistantToolUI<
  { expression: string },
  { result: number }
>({
  toolName: 'calculator',
  render: function CalculatorToolUIRender({ args, result, status }) {
    if (status.type === 'running') {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Calculating {args.expression}...</span>
        </div>
      );
    }

    if (result) {
      return (
        <Card className="bg-blue-50 dark:bg-blue-950/10">
          <CardContent className="pt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">
                {args.expression} =
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {result.result}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  },
});
