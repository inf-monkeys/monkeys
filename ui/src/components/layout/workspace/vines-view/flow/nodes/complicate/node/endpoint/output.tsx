import React, { useState } from 'react';

import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUpdateWorkflow } from '@/apis/workflow';
import {
  IVinesOutputData,
  WorkflowOutputConfig,
} from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/end-tool/workflow-output-config';
import { ComplicateNodeHeader } from '@/components/layout/workspace/vines-view/flow/nodes/complicate/node/header.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { CodeEditor } from '@/components/ui/code-editor';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

export const ComplicateEndNode: React.FC = () => {
  const { t } = useTranslation();

  const isWorkflowRUNNING = useCanvasStore((s) => s.isWorkflowRUNNING);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { vines } = useVinesFlow();
  const { trigger } = useUpdateWorkflow(workflowId ?? '');

  const [output, setOutput] = useState<IVinesOutputData[]>([]);

  const handleUpdate = () => {
    toast.promise(trigger({ output, version: vines.version }), {
      loading: t('workspace.flow-view.endpoint.end-tool.save.loading'),
      success: t('workspace.flow-view.endpoint.end-tool.save.success'),
      error: t('workspace.flow-view.endpoint.end-tool.save.error'),
    });
  };

  const executionOutput = vines.executionWorkflowExecution?.output ?? {};
  const hasExecutionOutput = Object.keys(executionOutput).length > 0;

  return (
    <>
      <ComplicateNodeHeader
        tool={{} as VinesToolDef}
        toolName=""
        customData={{
          icon: '🏁',
          title: t('workspace.flow-view.vines.tools.end.name'),
          description: '',
        }}
      >
        <Button
          className={cn(isWorkflowRUNNING && 'hidden')}
          variant="outline"
          size="small"
          icon={<Save />}
          onClick={handleUpdate}
        >
          {t('workspace.flow-view.vines.tools.end.save')}
        </Button>
      </ComplicateNodeHeader>
      {isWorkflowRUNNING ? (
        <Card className="mx-5 h-[23.5rem]">
          {hasExecutionOutput ? (
            <CodeEditor data={executionOutput} readonly={true} lineNumbers={3} />
          ) : (
            <div className="vines-center size-full">
              <h1 className="font-bold">{t('workspace.flow-view.vines.tools.end.empty-output')}</h1>
            </div>
          )}
        </Card>
      ) : (
        <WorkflowOutputConfig className="px-5" contentClassName="px-0" output={output} setOutput={setOutput} />
      )}
    </>
  );
};
