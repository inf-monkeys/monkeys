import React, { useEffect, useState } from 'react';

import { useDebounce } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { autoGenerateComfyuiWorkflowToolInput, updateComfyuiWorkflow } from '@/apis/comfyui';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';

interface IComfyuiWofrkflowToolInputProps {
  data: IComfyuiWorkflow;
}

export const ComfyuiWorkflowToolInput: React.FC<IComfyuiWofrkflowToolInputProps> = ({ data }) => {
  const { t } = useTranslation();

  const { toolInput, toolOutput } = data;

  const [updatedToolInput, setUpdatedToolInput] = useState<string>(JSON.stringify(toolInput || [], null, 4));
  const debounceUpdatedToolInput = useDebounce(updatedToolInput, { wait: 200 });

  const [updatedToolOutput, setUpdatedToolOutput] = useState<string>(JSON.stringify(toolOutput || [], null, 4));
  const debounceUpdatedToolOutput = useDebounce(updatedToolOutput, { wait: 200 });

  const onUpdateToolInput = async () => {
    let parsedToolInput;
    try {
      parsedToolInput = JSON.parse(debounceUpdatedToolInput);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.toast.not-json'));
      return;
    }
    await updateComfyuiWorkflow(data.id, {
      toolInput: parsedToolInput,
    });
    toast.success(t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.toast.save-success'));
  };

  const onUpdateToolOutput = async () => {
    let parsedToolOutput;
    try {
      parsedToolOutput = JSON.parse(debounceUpdatedToolOutput);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.not-json'));
      return;
    }
    await updateComfyuiWorkflow(data.id, {
      toolOutput: parsedToolOutput,
    });
    toast.success(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.save-success'));
  };

  const onAutoGenerate = async () => {
    const newInput = await autoGenerateComfyuiWorkflowToolInput(data.id);
    if (newInput) {
      setUpdatedToolInput(JSON.stringify(newInput, null, 4));
      toast.success(t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.toast.save-success'));
    }
  };

  useEffect(() => {
    setUpdatedToolInput(JSON.stringify(toolInput || [], null, 4));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold">{t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.title')}</h1>
      <br></br>
      <CodeEditor data={debounceUpdatedToolInput} height={400} lineNumbers={2} onUpdate={setUpdatedToolInput} />
      <br></br>
      <Button type="submit" onClick={onUpdateToolInput}>
        {t('common.utils.save')}
      </Button>
      <Button
        type="submit"
        onClick={onAutoGenerate}
        style={{
          marginLeft: 20,
        }}
      >
        {t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.button.auto-generate')}
      </Button>
      <br></br>
      <br></br>

      <h1 className="text-xl font-bold">{t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.title')}</h1>
      <br></br>
      <CodeEditor data={debounceUpdatedToolOutput} height={400} lineNumbers={2} onUpdate={setUpdatedToolOutput} />
      <br></br>
      <Button type="submit" onClick={onUpdateToolOutput}>
        {t('common.utils.save')}
      </Button>
    </div>
  );
};
