import React, { useState } from 'react';

import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateWorkflow } from '@/apis/workflow';
import {
  IVinesOutputData,
  WorkflowOutputConfig,
} from '@/components/layout/vines-flow/headless-modal/endpoint/end-tool/workflow-output-config';
import { ComplicateNodeHeader } from '@/components/layout/vines-flow/nodes/complicate/node/header.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { CodeEditor } from '@/components/ui/code-editor';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn, readLocalStorageValue } from '@/utils';

export const ComplicateEndNode: React.FC = () => {
  const { isWorkflowRUNNING } = useCanvasStore();
  const { workflowId } = useFlowStore();

  const { vines } = useVinesFlow();
  const { trigger } = useUpdateWorkflow(readLocalStorageValue('vines-apikey', '', false), workflowId ?? '');

  const [output, setOutput] = useState<IVinesOutputData[]>([]);

  const handleUpdate = () => {
    toast.promise(trigger({ output, version: vines.version }), {
      loading: '保存中...',
      success: '保存成功',
      error: '保存失败',
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
          title: '结束',
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
          保存配置
        </Button>
      </ComplicateNodeHeader>
      {isWorkflowRUNNING ? (
        <Card className="mx-5 h-[23.5rem]">
          {hasExecutionOutput ? (
            <CodeEditor data={executionOutput} readonly={true} lineNumbers={3} />
          ) : (
            <div className="vines-center size-full">
              <h1 className="font-bold">暂无输出</h1>
            </div>
          )}
        </Card>
      ) : (
        <WorkflowOutputConfig className="px-5" contentClassName="px-0" output={output} setOutput={setOutput} />
      )}
    </>
  );
};
