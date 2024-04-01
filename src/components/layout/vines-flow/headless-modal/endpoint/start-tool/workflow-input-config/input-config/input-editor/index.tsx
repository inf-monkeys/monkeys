import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForceUpdate } from '@mantine/hooks';
import { get, isArray, isBoolean, isUndefined, omit, pick, set } from 'lodash';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { WORKFLOW_INPUT_TYPE_OPTION_LIST } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/consts.ts';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/ui/input/tag';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Updater } from '@/components/ui/updater';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInput, workflowInputSchema } from '@/schema/workspace/workflow-input.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn, nanoIdLowerCase } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IInputEditorProps {}

export const InputEditor: React.FC<IInputEditorProps> = () => {
  const { isLatestWorkflowVersion, workflowId } = useFlowStore();

  const { vines } = useVinesFlow();

  const forceUpdate = useForceUpdate();

  const [variableId, setVariableId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const form = useForm<IWorkflowInput>({
    resolver: zodResolver(workflowInputSchema),
    defaultValues: {
      displayName: '',
      name: nanoIdLowerCase(6),
      type: 'string',
      default: '',
      multipleValues: false,
      assetType: '',
    },
  });

  useEffect(() => {
    const handleOpen = (_wid: string, id?: string) => {
      if (workflowId !== _wid) return;
      if (!id) {
        form.reset();
        form.setValue('name', nanoIdLowerCase(6));
      }
      setTimeout(() => forceUpdate());
      setVariableId(id);
      setOpen(true);
    };
    VinesEvent.on('flow-input-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-input-editor', handleOpen);
    };
  }, []);

  const currentVariable = vines.workflowInput.find((it) => it.name === variableId);

  useEffect(() => {
    if (!currentVariable) return;

    form.setValue('displayName', currentVariable.displayName);
    form.setValue('name', currentVariable.name);
    form.setValue('type', currentVariable.type as IWorkflowInput['type']);
    form.setValue('default', currentVariable.default as IWorkflowInput['default']);
    form.setValue('multipleValues', get(currentVariable, 'typeOptions.multipleValues', false));
    form.setValue('assetType', get(currentVariable, 'typeOptions.assetType', ''));
  }, [currentVariable]);

  const handleSubmit = form.handleSubmit((data) => {
    const { multipleValues, assetType, default: Default } = pick(data, ['multipleValues', 'assetType', 'default']);
    const finalVariable = omit(data, ['multipleValues', 'assetType', 'default']);
    multipleValues && set(finalVariable, 'typeOptions.multipleValues', true);
    assetType && set(finalVariable, 'typeOptions.assetType', assetType);
    Default && set(finalVariable, 'default', Default);

    if (finalVariable.type === 'boolean') {
      if (multipleValues) {
        console.log(Default);
        set(
          finalVariable,
          'default',
          ((Default || []) as (boolean | string)[])?.map((it) =>
            isBoolean(it) ? it : ['true', '1', 'yes', '真'].includes(it.toString()),
          ),
        );
      } else if (!isUndefined(Default)) {
        set(
          finalVariable,
          'default',
          isBoolean(Default) ? Default : ['true', '1', 'yes', '真'].includes(Default.toString()),
        );
      }
    }

    vines.update({ variable: finalVariable as VinesWorkflowVariable });

    setOpen(false);
  });

  const { multipleValues, assetType, type } = form.getValues();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-auto max-w-5xl">
        <DialogTitle>输入配置</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <div className="flex gap-2">
              <div className="flex min-w-72 max-w-md flex-col gap-2">
                <FormField
                  name="displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>显示名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入输入配置显示的名称" {...field} className="grow" autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>字段</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入输入字段" {...field} className="grow" />
                      </FormControl>
                      <FormDescription>
                        {`输入字段用于在工作流中引用输入的数据，在工具装配项中填写「 $\{workflow.input.${field.value}} 」来使用`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>数据类型</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {field.value
                                ? WORKFLOW_INPUT_TYPE_OPTION_LIST.find(
                                    (it) =>
                                      it.value === field.value &&
                                      it.multipleValues === multipleValues &&
                                      it.assetType === assetType,
                                  )?.label
                                : '选择数据类型'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput placeholder="搜索类型..." />
                            <CommandEmpty>找不到类型</CommandEmpty>
                            <CommandGroup>
                              {WORKFLOW_INPUT_TYPE_OPTION_LIST.map((it, i) => (
                                <CommandItem
                                  value={it.label}
                                  key={i}
                                  onSelect={() => {
                                    form.setValue('type', it.value as IWorkflowInput['type']);
                                    form.setValue('multipleValues', it.multipleValues);
                                    form.setValue('assetType', it.assetType);
                                    forceUpdate();
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      it.value === field.value &&
                                        it.multipleValues === multipleValues &&
                                        it.assetType === assetType
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {it.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="default"
                  control={form.control}
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel>默认值</FormLabel>
                      <FormControl>
                        <SmoothTransition>
                          {multipleValues ? (
                            <TagInput
                              placeholder="请输入默认值列表"
                              value={isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []}
                              onChange={(value) => form.setValue('default', value)}
                            />
                          ) : (
                            <Textarea
                              placeholder="请输入默认值"
                              className="resize-none"
                              value={value?.toString()}
                              {...field}
                            />
                          )}
                        </SmoothTransition>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {type === 'file' && isLatestWorkflowVersion && (
                <>
                  <Separator orientation="vertical" className="mx-2" />
                  <div className="flex w-[40rem] flex-col gap-2">
                    <Label>默认文件{multipleValues ? '列表' : ''}</Label>
                    <Updater
                      limit={multipleValues ? void 0 : 1}
                      onFinished={(urls) => form.setValue('default', multipleValues ? urls : urls[0])}
                    />
                    <p className="text-xs text-muted-foreground">在此处上传文件将自动生成文件直链来覆盖左侧默认值</p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline" className={cn(!isLatestWorkflowVersion && 'hidden')}>
                确定
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
