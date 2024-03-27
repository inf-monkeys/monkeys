import React, { useEffect, useMemo, useRef } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@mantine/core';
import { format } from 'date-fns';
import _ from 'lodash';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { useWorkflowVersions } from '@/apis/workflow/version';
import {
  EXECUTION_STATUS_LIST,
  LOG_VIEW_HEIGHT,
  TRIGGER_TYPE_LIST,
} from '@/components/layout/view/vines-log/filter/consts.ts';
import { VinesLogItem } from '@/components/layout/view/vines-log/item';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import MultipleSelector from '@/components/ui/multiple-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import {
  IVinesSearchWorkflowExecutionsParams,
  vinesSearchWorkflowExecutionsSchema,
} from '@/schema/workspace/workflow-execution.ts';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesLogView: React.FC = () => {
  const { visible } = useViewStore();
  const { pages } = useVinesPage();
  const { vines } = useVinesFlow();
  const navigate = useNavigate();

  const form = useForm<IVinesSearchWorkflowExecutionsParams>({
    resolver: zodResolver(vinesSearchWorkflowExecutionsSchema),
    defaultValues: {
      workflowInstanceId: '',
    },
  });

  const { data: searchWorkflowExecutionsData, trigger, isMutating } = useSearchWorkflowExecutions();

  const workflowPageRef = useRef(1);
  const workflowDefinitions = searchWorkflowExecutionsData?.definitions;
  const workflowExecutions = searchWorkflowExecutionsData?.data;
  const workflowTotal = searchWorkflowExecutionsData?.total;
  const { data: workflowMultiVersionData } = useWorkflowVersions(vines.workflowId ?? '');
  const workflowVersions = (workflowMultiVersionData ?? []).map((flow) => flow.version);
  const workflowVersionOptions = workflowVersions.map((ver) => {
    return {
      label: ver === -1 ? '临时' : ver.toString(),
      value: ver.toString(),
    };
  });
  const workflowStatusOptions = EXECUTION_STATUS_LIST.map(({ status, text }) => {
    return {
      label: text,
      value: status!,
    };
  });
  const workflowStatusOptionsMapper = useMemo(() => {
    return _.keyBy(EXECUTION_STATUS_LIST, 'status');
  }, [EXECUTION_STATUS_LIST]);
  const workflowTriggerTypeOptions = TRIGGER_TYPE_LIST.map(({ value, text }) => {
    return {
      label: text,
      value,
    };
  });
  const workflowTriggerTypeOptionsMapper = useMemo(() => {
    return _.keyBy(TRIGGER_TYPE_LIST, 'value');
  }, [TRIGGER_TYPE_LIST]);
  const workflowDefinitionIdMapper = useMemo(() => {
    return _.keyBy(workflowDefinitions, 'workflowId');
  }, [workflowDefinitions]);

  useEffect(() => {
    if (vines.workflowId && visible) {
      void handleSubmit();
    }
  }, [vines.workflowId, visible]);

  const handleSubmit = (loadNextPage?: boolean) => {
    if (vines.workflowId) {
      form.setValue('workflowId', vines.workflowId);
      if (loadNextPage) {
        workflowPageRef.current++;
      } else {
        workflowPageRef.current = 1;
      }
      form.setValue('pagination', {
        page: 1,
        limit: workflowPageRef.current * 10,
      });
      form.handleSubmit((params) => {
        toast.promise(trigger(params), {
          loading: '查询中...',
          error: '查询失败，请检查网络是否通畅',
        });
      })();
    } else {
      toast.warning('请等待页面加载完毕');
    }
  };

  const handleNavigateToPreview = (execution: VinesWorkflowExecution) => {
    const previewPage = pages?.find(({ type }) => type === 'preview');
    if (previewPage) {
      if (vines.swapExecutionInstance(execution)) {
        void navigate({
          to: '/$teamId/workspace/$workflowId/$pageId',
          params: {
            pageId: previewPage._id,
          },
        });
      }
    } else {
      toast.error('打开详情失败！找不到预览视图');
    }
  };

  const workflowExecutionLength = workflowExecutions?.length ?? 0;

  return (
    <main className="flex flex-col gap-2 p-10">
      <div className="flex justify-between px-2">
        <span className="text-lg font-bold">{vines.workflowName}</span>
        <span>
          共 {workflowTotal} 项{workflowExecutions && workflowDefinitions && `，已加载 ${workflowExecutions.length} 项`}
        </span>
      </div>
      <div className="flex gap-4">
        <div className="w-[300px]">
          <ScrollArea className={LOG_VIEW_HEIGHT}>
            <div className="flex flex-col gap-4 px-2">
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  onReset={() => {
                    form.reset();
                    handleSubmit();
                  }}
                  className="flex flex-col"
                >
                  <FormField
                    control={form.control}
                    name="versions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>版本号</FormLabel>
                        <FormControl>
                          <MultipleSelector
                            value={(field.value ?? []).map((ver) => {
                              return {
                                label: ver === -1 ? '临时' : ver.toString(),
                                value: ver.toString(),
                              };
                            })}
                            onChange={(options) => {
                              field.onChange(options.map((option) => parseInt(option.value)));
                            }}
                            defaultOptions={workflowVersionOptions}
                            placeholder="请选择版本号"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTimeFrom"
                    render={({ field }) => {
                      const endTimeTo = form.getValues('endTimeTo');
                      return (
                        <FormItem>
                          <FormLabel>开始运行时间</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="date"
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    endTimeTo ? (
                                      <>
                                        {format(field.value, 'yyyy-MM-dd')} - {format(endTimeTo, 'yyyy-MM-dd')}
                                      </>
                                    ) : (
                                      format(field.value, 'yyyy-MM-dd')
                                    )
                                  ) : (
                                    <span>请选择开始时间</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  initialFocus
                                  mode="range"
                                  defaultMonth={field.value ? new Date(field.value) : undefined}
                                  selected={{
                                    from: field.value ? new Date(field.value) : undefined,
                                    to: endTimeTo ? new Date(endTimeTo) : undefined,
                                  }}
                                  onSelect={(selectedDate) => {
                                    selectedDate?.from && field.onChange(selectedDate.from.getTime());
                                    selectedDate?.to && form.setValue('endTimeTo', selectedDate.to.getTime());
                                  }}
                                  numberOfMonths={2}
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>状态</FormLabel>
                        <FormControl>
                          <MultipleSelector
                            value={(field.value ?? []).map((status) => {
                              return {
                                label: workflowStatusOptionsMapper[status].text,
                                value: status,
                              };
                            })}
                            onChange={(options) => {
                              field.onChange(options.map((option) => option.value));
                            }}
                            defaultOptions={workflowStatusOptions}
                            placeholder="请选择状态"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="triggerTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>触发方式</FormLabel>
                        <FormControl>
                          <MultipleSelector
                            value={(field.value ?? []).map((value) => {
                              return {
                                label: workflowTriggerTypeOptionsMapper[value].text,
                                value,
                              };
                            })}
                            onChange={(options) => {
                              field.onChange(options.map((option) => option.value));
                            }}
                            defaultOptions={workflowTriggerTypeOptions}
                            placeholder="请选择触发方式"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="workflowInstanceId"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>实例 ID</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入应用实例 ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderBy.order"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between py-3">
                          <FormLabel>由旧到新排序</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value === 'ASC'}
                              onCheckedChange={(asc) => {
                                field.onChange(asc ? 'ASC' : 'DESC');
                              }}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="mt-2 flex w-full gap-2">
                    <Button type="reset" theme="tertiary" className="flex-1" disabled={isMutating}>
                      重置
                    </Button>
                    <Button type="submit" variant="solid" className="flex-1" disabled={isMutating}>
                      查询
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </div>
        <div className="h-full flex-1">
          <ScrollArea className={LOG_VIEW_HEIGHT}>
            <div className="flex h-full flex-col gap-3 px-2">
              {!workflowExecutionLength && <div className="vines-center size-full">暂无数据</div>}
              {workflowExecutions && workflowDefinitions
                ? workflowExecutions.map((workflowExecution, index) => (
                    <VinesLogItem
                      key={index}
                      onClick={() => handleNavigateToPreview(workflowExecution)}
                      workflowExecution={workflowExecution}
                      workflowDefinition={workflowDefinitionIdMapper[workflowExecution.workflowName!]}
                    />
                  ))
                : null}
              {workflowExecutions && workflowDefinitions && workflowTotal ? (
                workflowTotal - workflowExecutionLength <= 0 ? (
                  <div className="w-full cursor-default text-center">到底了</div>
                ) : (
                  <div
                    className="w-full cursor-pointer bg-opacity-0 py-2 text-center hover:bg-foreground-500 hover:bg-opacity-5"
                    onClick={() => handleSubmit(true)}
                  >
                    剩余 {workflowTotal - workflowExecutionLength} 项，点击加载
                  </div>
                )
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
};
