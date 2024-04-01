import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { Info, Plus, TrashIcon } from 'lucide-react';

import { useGetWorkflow } from '@/apis/workflow';
import { WorkflowOutputVariableEditor } from '@/components/layout/vines-flow/headless-modal/endpoint/end-tool/workflow-output-config/variable-editor.tsx';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';

export interface IVinesOutputData {
  key: string;
  value: string;
}

interface IWorkflowOutputConfigProps extends React.ComponentPropsWithoutRef<'div'> {
  output: IVinesOutputData[];
  setOutput: React.Dispatch<React.SetStateAction<IVinesOutputData[]>>;
  contentClassName?: string;
}

export const WorkflowOutputConfig: React.FC<IWorkflowOutputConfigProps> = ({
  className,
  contentClassName,
  output,
  setOutput,
}) => {
  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { canvasMode } = useCanvasStore();

  const { vines } = useVinesFlow();
  const { data: workflow } = useGetWorkflow(workflowId, vines.version);

  const variableMapper = Object.fromEntries(vines.variablesMapper.entries());

  const outputRef = useRef<IVinesOutputData[]>([]);

  const outputRawData = useMemo(() => JSON.stringify(output, null, 2), [output]);
  const outputLength = output?.length;

  const [initial, setInitial] = useState<boolean>(true);

  useEffect(() => {
    if (!workflow) return;
    const workflowOutput = (get(workflow, 'output', []) ?? []) as IVinesOutputData[];
    setOutput(workflowOutput);
    outputRef.current = workflowOutput;
    setInitial(false);
    setTimeout(() => setInitial(true));
  }, [workflow]);

  const handleDelete = useCallback(
    (index: number) =>
      setOutput((prevOutput) => {
        const finalData = prevOutput.filter((_, i) => i !== index);
        outputRef.current = finalData;
        return finalData;
      }),
    [setOutput],
  );

  const handleValueChange = useCallback(
    (index: number, newValue: string, type: 'key' | 'value') => {
      setOutput((prevOutput) => {
        const finalData = prevOutput.map((it, i) => (i === index ? { ...it, [type]: newValue as string } : it));
        outputRef.current = finalData;
        return finalData;
      });
    },
    [setOutput],
  );

  const editorLock = useRef<boolean>(false);
  const [editorError, setEditorError] = useState<string>('');
  const handleUpdateRaw = useCallback(
    (data: string) => {
      if (editorLock.current) return;
      try {
        setEditorError('');
        const json = JSON.parse(data);
        if (Array.isArray(json)) {
          const isValid = json.every((it) => {
            if (!Object.keys(it).every((key) => key === 'key' || key === 'value')) return false;
            return !(typeof it.key !== 'string' || typeof it.value !== 'string');
          });
          if (!isValid) {
            setEditorError('JSON 只能为 key-value 对象数组');
            return;
          }
          outputRef.current = json;
          setOutput(json);
        } else {
          setEditorError('JSON 必须为数组');
        }
      } catch {
        setEditorError('JSON 格式错误');
      }
    },
    [setOutput, outputRef.current],
  );

  const disabled = canvasMode !== CanvasStatus.EDIT;

  return (
    <Tabs defaultValue="output" className={className}>
      <TabsList>
        <TabsTrigger value="output">输出配置</TabsTrigger>
        <TabsTrigger value="rawdata">原始数据</TabsTrigger>
      </TabsList>
      <TabsContent value="output" className="relative h-80">
        <AnimatePresence>
          {!outputLength ? (
            <motion.div
              className="absolute top-0 flex h-full w-full flex-col items-center justify-center gap-2"
              key="vines-workflow-output-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                icon={<Plus />}
                onClick={() => {
                  outputRef.current = [{ key: 'output1', value: 'simple data' }];
                  setOutput(outputRef.current);
                }}
                disabled={disabled || !isLatestWorkflowVersion}
                variant="outline"
              >
                新建输出配置
              </Button>
              <h1 className="text-xl font-bold">在此处调整工作流输出</h1>
              <span className="text-xs text-gray-10">工作流默认输出为最后一个节点的运行结果</span>
            </motion.div>
          ) : initial ? (
            <motion.div
              className={cn('flex h-full w-full flex-col gap-4 overflow-y-auto p-4', contentClassName)}
              key="vines-workflow-output-config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {output.map((it, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    className="h-10 min-w-20 flex-[30%]"
                    value={it.key}
                    onChange={(val) => handleValueChange(index, val, 'key')}
                    placeholder="参数名"
                    disabled={disabled}
                  />
                  <div
                    key={it.key}
                    className={cn(
                      'relative flex h-full flex-[70%] items-center justify-end',
                      'pointer-events-none' && disabled,
                    )}
                  >
                    <WorkflowOutputVariableEditor
                      value={it.value?.toString() || ''}
                      onChange={(val) => handleValueChange(index, val, 'value')}
                      disabled={disabled}
                      variableMapper={variableMapper}
                      workflowId={workflowId}
                    />
                  </div>
                  {!disabled && (
                    <Button
                      icon={<TrashIcon />}
                      onClick={() => handleDelete(index)}
                      disabled={disabled}
                      variant="outline"
                    />
                  )}
                </div>
              ))}
              {!disabled && (
                <div className="w-full text-center">
                  <Button
                    icon={<Plus />}
                    onClick={() => {
                      outputRef.current = [...outputRef.current, { key: `output${outputLength + 1}`, value: '' }];
                      setOutput(outputRef.current);
                    }}
                    disabled={disabled}
                    variant="outline"
                  >
                    新建输出配置
                  </Button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </TabsContent>
      <TabsContent value="rawdata" className="h-80">
        <CodeEditor
          className="overflow-clip rounded-md shadow-sm"
          data={outputRawData}
          onUpdate={handleUpdateRaw}
          lineNumbers={3}
          minimap={false}
          readonly={disabled || !isLatestWorkflowVersion}
        />
        {editorError && (
          <p className="pointer-events-none absolute bottom-7 left-8 flex items-center gap-2 text-xs text-danger opacity-80">
            <Info size={14} />
            {editorError}
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
};
