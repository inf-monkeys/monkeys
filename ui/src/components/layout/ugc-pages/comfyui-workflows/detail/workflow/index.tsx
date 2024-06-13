import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { updateComfyuiWorkflow } from '@/apis/comfyui';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { toast } from 'sonner';

interface IComfyuiWofrkflowProps {
  data: IComfyuiWorkflow;
}

export const ComfyuiWorkflowDetail: React.FC<IComfyuiWofrkflowProps> = ({ data }) => {
  const { t } = useTranslation();
  const { workflow, prompt } = data;
  const [updatedWorkflowJson, setUpdatedWorkflowJson] = useState(JSON.stringify(workflow || {}, null, 4));
  const [updatedWorkflowApiJson, setUpdatedWorkflowApiJson] = useState(JSON.stringify(prompt || {}, null, 4));

  const onUpdateToolWorkflowJson = async () => {
    let parsedWorkflow;
    try {
      parsedWorkflow = JSON.parse(updatedWorkflowJson);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.not-json'));
      return;
    }
    let parsedPrompt;
    try {
      parsedPrompt = JSON.parse(updatedWorkflowApiJson);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.not-json'));
      return;
    }
    await updateComfyuiWorkflow(data.id, {
      workflow: parsedWorkflow,
      workflowApi: parsedPrompt,
    });
    toast.success(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.save-success'));
  };

  return (
    <div>
      <h1 className="text-xl font-bold">{t('ugc-page.comfyui-workflow.detail.tabs.workflow.json')}</h1>
      <br></br>
      <CodeEditor
        data={JSON.stringify(workflow, null, 4)}
        height={400}
        lineNumbers={2}
        onUpdate={setUpdatedWorkflowJson}
      />
      <br></br>
      <h1 className="text-xl font-bold">{t('ugc-page.comfyui-workflow.detail.tabs.workflow.api-json')}</h1>
      <br></br>
      <CodeEditor
        data={JSON.stringify(prompt, null, 4)}
        height={400}
        lineNumbers={2}
        onUpdate={setUpdatedWorkflowApiJson}
      />
      <br></br>
      <Button type="submit" onClick={onUpdateToolWorkflowJson}>
        {t('common.utils.save')}
      </Button>
    </div>
  );
};
