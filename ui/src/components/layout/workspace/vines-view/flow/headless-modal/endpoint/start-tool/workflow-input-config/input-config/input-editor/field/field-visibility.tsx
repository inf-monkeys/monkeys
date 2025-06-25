import React, { useEffect } from 'react';

import { useDynamicList } from 'ahooks';
import { Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AutosizeTextarea } from '@/components/ui/autosize-textarea.tsx';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { PillInput } from '@/components/ui/pill-input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { IVisibilityCondition, IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { getI18nContent } from '@/utils';
import { getAvailableOperators } from '@/utils/visibility';

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

  // 判断操作符是否支持多值
  const isMultiValueOperator = (operator: string) => {
    return ['in', 'notIn'].includes(operator);
  };

  // 获取动态描述
  const getLogicDescription = (logic: 'AND' | 'OR') => {
    if (logic === 'AND') {
      return t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.description.and');
    } else {
      return t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.description.or');
    }
  };

  return (
    <FormField
      name="visibility"
      control={form.control}
      render={() => (
        <FormItem className="space-y-4">
          <div className="space-y-2">
            <FormLabel className="flex items-center gap-2">
              {/* <Eye size={16} /> */}
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.label')}
            </FormLabel>
            <p className="text-sm text-muted-foreground">
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.description.main')}
            </p>
          </div>

          {hasConditions && (
            <div className="space-y-4">
              {/* 逻辑选择器 */}
              <div className="space-y-2">
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
                <p className="text-xs text-muted-foreground">{getLogicDescription(logic)}</p>
              </div>

              {/* 条件列表 */}
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {list.map((condition, i) => {
                    const selectedInput = workflowInput.find(({ name }) => name === condition.field);
                    const isMultiValue = isMultiValueOperator(condition.operator);

                    return (
                      <div key={i} className="flex items-center gap-2 p-1">
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
                        <Select
                          value={condition.operator}
                          onValueChange={(operator) => {
                            const updatedCondition = {
                              ...condition,
                              operator: operator as IVisibilityCondition['operator'],
                              // 如果从多值操作符切换到单值操作符，需要处理 value
                              value: isMultiValueOperator(operator)
                                ? Array.isArray(condition.value)
                                  ? condition.value
                                  : [condition.value]
                                : Array.isArray(condition.value)
                                  ? condition.value[0]
                                  : condition.value,
                            };
                            replace(i, updatedCondition);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue
                              placeholder={t(
                                'workspace.flow-view.endpoint.start-tool.input.config-form.visibility.operator-placeholder',
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableOperators(selectedInput?.type || 'string').map((op) => (
                              <SelectItem key={op} value={op}>
                                {t(
                                  `workspace.flow-view.endpoint.start-tool.input.config-form.visibility.operators.${op}`,
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* 值输入 */}
                        <div className="flex-1">
                          {isMultiValue ? (
                            <PillInput
                              value={Array.isArray(condition.value) ? condition.value : [condition.value]}
                              onChange={(values) => {
                                replace(i, { ...condition, value: values });
                              }}
                              fieldType={
                                ['string', 'number', 'boolean'].includes(selectedInput?.type || 'string')
                                  ? (selectedInput?.type as 'string' | 'number' | 'boolean')
                                  : 'string'
                              }
                              placeholder={t(
                                'workspace.flow-view.endpoint.start-tool.input.config-form.visibility.value-placeholder',
                              )}
                            />
                          ) : selectedInput?.type === 'boolean' ? (
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
                              value={
                                Array.isArray(condition.value)
                                  ? condition.value[0]?.toString() || ''
                                  : condition.value?.toString() || ''
                              }
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
