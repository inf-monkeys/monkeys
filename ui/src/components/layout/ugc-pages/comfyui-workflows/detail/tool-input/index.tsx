import React, { useEffect } from 'react';

import { useDebouncedState } from '@mantine/hooks';
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
  const { toolInput } = data;

  const [updatedToolInput, setUpdatedToolInput] = useDebouncedState(JSON.stringify(toolInput || [], null, 4), 200);
  const onSubmit = async () => {
    let parsedToolInput;
    try {
      parsedToolInput = JSON.parse(updatedToolInput);
    } catch {
      toast.error('工具表单配置必须为 JSON');
      return;
    }
    await updateComfyuiWorkflowToolInput(data.id, parsedToolInput);
    toast.success('保存成功');
  };

  const onAutoGenerate = async () => {
    const newInput = await autoGenerateComfyuiWorkflowToolInput(data.id);
    if (newInput) {
      setUpdatedToolInput(JSON.stringify(newInput, null, 4));
      toast.success('保存成功');
    }
  };

  useEffect(() => {
    setUpdatedToolInput(JSON.stringify(toolInput || [], null, 4));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold">工具表单配置</h1>
      <br></br>
      <CodeEditor data={updatedToolInput} height={400} lineNumbers={2} onUpdate={setUpdatedToolInput} />
      <br></br>
      <Button type="submit" onClick={onSubmit}>
        保存配置
      </Button>
      <Button
        type="submit"
        onClick={onAutoGenerate}
        style={{
          marginLeft: 20,
        }}
      >
        重新生成
      </Button>
    </div>
  );
};