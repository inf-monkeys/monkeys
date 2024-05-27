import React, { useEffect } from 'react';

import { useDebouncedState } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { autoGenerateComfyuiWorkflowToolInput, updateComfyuiWorkflowToolInput } from '@/apis/comfyui';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';

interface IComfyuiWofrkflowToolInputProps {
  data: IComfyuiWorkflow;
}

// million-ignore
export const ComfyuiWorkflowToolInput: React.FC<IComfyuiWofrkflowToolInputProps> = ({ data }) => {
  const { t } = useTranslation();

  const { toolInput } = data;

  const [updatedToolInput, setUpdatedToolInput] = useDebouncedState(JSON.stringify(toolInput || [], null, 4), 200);
  const onSubmit = async () => {
    let parsedToolInput;
    try {
      parsedToolInput = JSON.parse(updatedToolInput);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.toast.not-json'));
      return;
    }
    await updateComfyuiWorkflowToolInput(data.id, parsedToolInput);
    toast.success(t('ugc-page.comfyui-workflow.detail.tabs.toolsInput.toast.save-success'));
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
      <CodeEditor data={updatedToolInput} height={400} lineNumbers={2} onUpdate={setUpdatedToolInput} />
      <br></br>
      <Button type="submit" onClick={onSubmit}>
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
    </div>
  );
};
