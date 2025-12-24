/**
 * Runtime registry for workflow shapes.
 *
 * We register per-shape imperative handlers (run / refreshInputs) from inside the
 * Workflow shape React component, so other UI (e.g. "Run all") can trigger them.
 */
export type WorkflowShapeRuntime = {
  run: (opts?: { silent?: boolean }) => Promise<void>;
  refreshInputs: () => void;
};

const registry = new Map<string, WorkflowShapeRuntime>();

export function registerWorkflowRuntime(shapeId: string, runtime: WorkflowShapeRuntime) {
  registry.set(shapeId, runtime);
}

export function unregisterWorkflowRuntime(shapeId: string, runtime?: WorkflowShapeRuntime) {
  if (!runtime) {
    registry.delete(shapeId);
    return;
  }
  const existing = registry.get(shapeId);
  if (existing === runtime) {
    registry.delete(shapeId);
  }
}

export function getWorkflowRuntime(shapeId: string): WorkflowShapeRuntime | undefined {
  return registry.get(shapeId);
}

export function listWorkflowRuntimeShapeIds(): string[] {
  return Array.from(registry.keys());
}


