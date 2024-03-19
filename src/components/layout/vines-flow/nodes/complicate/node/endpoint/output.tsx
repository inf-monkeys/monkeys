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
import { useVinesFlow } from '@/package/vines-flow';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { readLocalStorageValue } from '@/utils';

export const ComplicateEndNode: React.FC = () => {
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
        <Button variant="outline" size="small" icon={<Save />} onClick={handleUpdate}>
          保存配置
        </Button>
      </ComplicateNodeHeader>
      <div className="w-full px-5">
        <WorkflowOutputConfig output={output} setOutput={setOutput} />
      </div>
    </>
  );
};
