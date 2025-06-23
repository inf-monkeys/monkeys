import React, { useEffect } from 'react';

import { useDynamicList } from 'ahooks';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { IVisibilityCondition, IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { getI18nContent } from '@/utils';

interface IFieldFieldVisibilityProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldFieldVisibility: React.FC<IFieldFieldVisibilityProps> = ({ form }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const { name: currentFieldName } = form.getValues();
  const workflowInput = vines.workflowInput.filter(({ name }) => currentFieldName !== name);

  const visibility = form.watch('visibility');
  const conditions = visibility?.conditions || [];
  const logic = visibility?.logic || 'AND';

  const { list, remove, push, replace } = useDynamicList<IVisibilityCondition>(conditions);

  const hasConditions = list.length > 0;

  // 同步表单数据
  useEffect(() => {
    if (hasConditions) {
      form.setValue('visibility', {
        conditions: list,
        logic,
      });
    } else {
      form.setValue('visibility', undefined);
    }
  }, [list, logic, hasConditions, form]);

  return (
    <FormField
      name="visibility"
      control={form.control}
      render={() => (
        <FormItem className="space-y-4">
          <FormLabel className="flex items-center gap-2">
            <Eye size={16} />
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.label')}
          </FormLabel>

          {hasConditions && (
            <div className="space-y-4">
              {/* 逻辑选择器 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.logic-label')}:
                </span>
                <Select
                  value={logic}
                  onValueChange={(value: 'AND' | 'OR') => {
                    form.setValue('visibility.logic', value);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 条件列表 */}
              <ScrollArea className="max-h-48 rounded-md border p-2">
                <div className="space-y-2">
                  {list.map((condition, i) => {
                    const selectedInput = workflowInput.find(({ name }) => name === condition.field);

                    return (
                      <div key={i} className="flex items-center gap-2 rounded-md border p-2">
                        {/* 字段选择 */}
                        <Select
                          value={condition.field}
                          onValueChange={(field) => {
                            const updatedCondition = { ...condition, field };
                            replace(i, updatedCondition);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue
                              placeholder={t(
                                'workspace.flow-view.endpoint.start-tool.input.config-form.visibility.field-placeholder',
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="flex max-h-40 flex-col overflow-y-auto">
                              {workflowInput.map(({ name: itName, displayName }) => (
                                <SelectItem
                                  key={itName}
                                  value={itName}
                                  disabled={list.some(({ field }, j) => j !== i && field === itName)}
                                >
                                  {getI18nContent(displayName)}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>

                        {/* 操作符 */}
                        <span className="text-sm text-muted-foreground">is</span>

                        {/* 值输入 */}
                        <div className="flex-1">
                          {selectedInput?.type === 'boolean' ? (
                            <Select
                              value={condition.value?.toString()}
                              onValueChange={(value) => {
                                const boolValue = value === 'true';
                                replace(i, { ...condition, value: boolValue });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    'workspace.flow-view.endpoint.start-tool.input.config-form.visibility.value-placeholder',
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <AutosizeTextarea
                              minHeight={36}
                              disabled={!condition.field}
                              value={condition.value?.toString() || ''}
                              onChange={(e) => {
                                let value: string | number = e.target.value;
                                // 如果字段类型是number，尝试转换
                                if (selectedInput?.type === 'number') {
                                  const numValue = Number(value);
                                  if (!isNaN(numValue)) {
                                    value = numValue;
                                  }
                                }
                                replace(i, { ...condition, value });
                              }}
                              placeholder={t(
                                'workspace.flow-view.endpoint.start-tool.input.config-form.visibility.value-placeholder',
                              )}
                            />
                          )}
                        </div>

                        {/* 删除按钮 */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button icon={<Trash2 />} size="small" variant="outline" onClick={() => remove(i)} />
                          </TooltipTrigger>
                          <TooltipContent>{t('common.utils.delete')}</TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* 添加条件按钮 */}
          <Button
            variant="outline"
            size="small"
            icon={<Plus />}
            onClick={() => push({ field: '', operator: 'is', value: '' })}
            disabled={list.length >= workflowInput.length}
          >
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.add-condition')}
          </Button>

          <FormControl>
            <div />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
