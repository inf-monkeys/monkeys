import React, { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { BlockDefProperties } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { fromPairs, isArray, isBoolean } from 'lodash';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/ui/input/tag';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Switch } from '@/components/ui/switch';
import { VinesUpdater } from '@/components/ui/updater';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm, workflowInputFormSchema } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IVinesWorkflowInputProps {
  inputs: VinesWorkflowVariable[];
  height?: number;
  children?: React.ReactNode;
  onSubmit?: (data: IWorkflowInputForm) => void;

  formClassName?: string;
  scrollAreaClassName?: string;
  itemClassName?: string;
}

const BOOLEAN_VALUES = ['true', 'yes', '是', '1'];

export const VinesWorkflowInput: React.FC<IVinesWorkflowInputProps> = ({
  inputs,
  height,
  children,
  onSubmit,

  formClassName,
  scrollAreaClassName,
  itemClassName,
}) => {
  const form = useForm<IWorkflowInputForm>({
    resolver: zodResolver(workflowInputFormSchema),
  });

  useEffect(() => {
    if (!inputs) return;
    const defaultValues = fromPairs(
      inputs
        .filter(({ default: v }) => v)
        .map((it) => {
          const defValue = it.default;
          const type = it.type;
          const isMultiple = it.typeOptions?.multipleValues ?? false;

          if (type === 'number') {
            return [
              it.name,
              isMultiple ? ((defValue as string[]) ?? []).map((it) => Number(it)) : Number(defValue ?? 0),
            ];
          }

          if (type === 'boolean') {
            return [
              it.name,
              isMultiple
                ? ((defValue as string[]) ?? []).map((it) => BOOLEAN_VALUES.includes(it))
                : BOOLEAN_VALUES.includes((defValue ?? '')?.toString()),
            ];
          }

          return [it.name, defValue];
        }),
    ) as IWorkflowInputForm;
    form.reset(defaultValues);
  }, [inputs]);

  const handleSubmit = form.handleSubmit((data) => {
    for (const [key, value] of Object.entries(data)) {
      if (isArray(value)) {
        if (inputs?.find((it) => it.name === key)?.type === 'boolean') {
          data[key] = value.map((it) => BOOLEAN_VALUES.includes(it));
        }
      }
    }
    onSubmit?.(data);
  });

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col gap-4', formClassName)}
        onSubmit={handleSubmit}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      >
        <ScrollArea className={scrollAreaClassName} style={{ height }}>
          <div className={cn('flex flex-col gap-4', formClassName)}>
            {inputs?.map(({ displayName, name, type, typeOptions, ...other }) => {
              const isMultiple = typeOptions?.multipleValues ?? false;
              const isNumber = type === 'number';
              return (
                <FormField
                  key={name}
                  name={name}
                  control={form.control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem
                      className={cn(
                        'overflow-clip rounded-lg border bg-card px-3 pb-1 pt-2 text-card-foreground shadow-sm',
                        itemClassName,
                      )}
                    >
                      <FormLabel className="font-bold">{displayName}</FormLabel>
                      <FormControl>
                        <>
                          {['string', 'number', 'file'].includes(type) &&
                            (isMultiple ? (
                              <TagInput
                                value={
                                  isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []
                                }
                                onChange={(value) =>
                                  form.setValue(
                                    name,
                                    value.filter((it) => (isNumber ? !isNaN(Number(it)) : it)),
                                  )
                                }
                                placeholder={`请输入${displayName}`}
                              />
                            ) : (
                              <Input
                                placeholder={`请输入${displayName}`}
                                value={(value as string) ?? ''}
                                onChange={(value) => {
                                  if (isNumber) {
                                    const numberValue = Number(value);
                                    onChange(isNaN(numberValue) ? '' : numberValue);
                                  } else {
                                    onChange(value);
                                  }
                                }}
                                className="grow"
                                autoFocus
                                {...field}
                              />
                            ))}

                          {type === 'boolean' && (
                            <div>
                              {isMultiple ? (
                                <TagInput
                                  value={isArray(value) ? value.map((it: any) => it.toString()) : []}
                                  onChange={(value) =>
                                    form.setValue(
                                      name,
                                      value.filter((it) => BOOLEAN_VALUES.includes(it)),
                                    )
                                  }
                                  placeholder={`请输入${displayName}`}
                                />
                              ) : (
                                <Switch
                                  checked={isBoolean(value) ? value : BOOLEAN_VALUES.includes(value?.toString())}
                                  onCheckedChange={onChange}
                                />
                              )}
                            </div>
                          )}

                          {type === 'file' && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-opacity-70">请输入文件直链</span>
                              <VinesUpdater
                                limit={isMultiple ? void 0 : 1}
                                onFinished={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}
                              >
                                <Button variant="outline" size="small" className="-mr-1 scale-90">
                                  点击上传文件
                                </Button>
                              </VinesUpdater>
                            </div>
                          )}

                          {type === 'options' && (
                            <Select
                              onValueChange={(val) =>
                                onChange(
                                  (
                                    (other as BlockDefProperties)?.options?.find((it) =>
                                      'value' in it ? it.value.toString() : '' === val,
                                    ) as any
                                  )?.value ?? '',
                                )
                              }
                              defaultValue={value as string}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择一个选项" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(other as BlockDefProperties)?.options?.map((it, i) => (
                                  <SelectItem value={'value' in it ? it.value.toString() : ''} key={i}>
                                    {it.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </div>
        </ScrollArea>
        {children}
      </form>
    </Form>
  );
};
