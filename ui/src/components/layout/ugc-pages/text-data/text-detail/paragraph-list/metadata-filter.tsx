import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Filter, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';

import { IVectorMetadataField } from '@/apis/vector/typings.ts';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IMetadataFilter, metadataFilterSchema } from '@/schema/text-dataset/metadata-filter.ts';

interface IMetadataFilterProps {
  metadata: IVectorMetadataField[];
  onFilter?: (metadata: { [x: string]: unknown }) => void;
}

export const MetadataFilter: React.FC<IMetadataFilterProps> = ({ metadata, onFilter }) => {
  const [visible, setVisible] = useState(false);

  const form = useForm<IMetadataFilter>({
    mode: 'onChange',
    resolver: zodResolver(metadataFilterSchema, undefined, {
      raw: true,
    }),
  });

  const { fields, append, update, replace, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });
  const handleSubmit = form.handleSubmit((data) => {
    const obj = data.metadata.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
    setVisible(false);
    onFilter?.(obj);
  });

  const { isDirty, isValid, errors } = form.formState;
  const isSubmittable = isDirty && isValid;

  const finalMetadata = metadata?.filter((it) => !fields?.map((field) => field.key)?.includes(it.name)) ?? [];

  return (
    <Tooltip>
      <Popover open={visible} onOpenChange={setVisible}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button icon={<Filter />} variant="outline" size="small" />
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent className="w-[30rem]">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">筛选数据</h4>
              <p className="text-sm text-muted-foreground">根据段落 Metadata 进行筛选</p>
            </div>
            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                {fields.map((field, index) => {
                  const errorForField = errors?.metadata?.[index]?.value?.message;
                  return (
                    <FormField
                      control={form.control}
                      name={`metadata.${index}`}
                      key={field.id}
                      render={() => (
                        <FormItem>
                          <div className="flex items-center gap-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Label className="line-clamp-1 min-w-14 max-w-36">{field.key}</Label>
                              </TooltipTrigger>
                              <TooltipContent>{field.key}</TooltipContent>
                            </Tooltip>
                            <Select
                              value={field.key}
                              onValueChange={(val) => update(index, { key: val, value: field.value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择一个字段" />
                              </SelectTrigger>
                              <SelectContent>
                                {metadata.map(({ displayName, name }, i) => (
                                  <SelectItem
                                    key={i}
                                    value={name}
                                    className="cursor-pointer"
                                    disabled={fields.map((field) => field.key).includes(name)}
                                  >
                                    {displayName || name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <input
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="匹配值"
                              {...form.register(`metadata.${index}.value` as const)}
                            />
                            <Button
                              className="[&_svg]:stroke-red-10"
                              size="small"
                              variant="outline"
                              icon={<Trash2 />}
                              onClick={() => remove(index)}
                            />
                          </div>
                          <FormMessage>{errorForField}</FormMessage>
                        </FormItem>
                      )}
                    />
                  );
                })}

                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      icon={<Plus />}
                      onClick={() => {
                        append({
                          key: finalMetadata?.[0]?.name,
                          value: '',
                        });
                      }}
                      disabled={!finalMetadata.length}
                    >
                      添加筛选条件
                    </Button>
                    <Button variant="outline" onClick={() => replace([])}>
                      清空条件
                    </Button>
                  </div>
                  <Button type="submit" variant="outline" disabled={!isSubmittable}>
                    确定
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>根据 Metadata 筛选</TooltipContent>
    </Tooltip>
  );
};
