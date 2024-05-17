import React from 'react';

import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { CodeEditor } from '@/components/ui/code-editor';

interface IComfyuiWofrkflowProps {
  data: IComfyuiWorkflow;
}

export const ComfyuiWorkflowDetail: React.FC<IComfyuiWofrkflowProps> = ({ data }) => {
  const { workflow, prompt } = data;
  return (
    <div>
      <h1 className="text-xl font-bold">工作流 JSON （workflow.json）</h1>
      <br></br>
      <CodeEditor data={JSON.stringify(workflow, null, 4)} height={400} lineNumbers={2} />
      <br></br>
      <h1 className="text-xl font-bold">工作流 API JSON （workflow_api.json）</h1>
      <br></br>
      <CodeEditor data={JSON.stringify(prompt, null, 4)} height={400} lineNumbers={2} />
    </div>
  );
};
