/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouterState } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounceFn, useLatest, useMap } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { fromPairs, groupBy, isArray, isEmpty, omit, set } from 'lodash';
import { ChevronRightIcon, Workflow } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  TWorkflowInstanceByImageUrl,
  useMutationSearchWorkflowExecutions,
  useWorkflowInstanceByImageUrl,
} from '@/apis/workflow/execution';
import { VinesFormFieldItem } from '@/components/layout/workspace/vines-view/form/tabular/render/item.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { Form } from '@/components/ui/form.tsx';
import { Label } from '@/components/ui/label.tsx';
import { VinesFullLoading, VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { VinesWorkflowExecutionInput } from '@/package/vines-flow/core/typings';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input.ts';
import { IWorkflowInputForm, workflowInputFormSchema } from '@/schema/workspace/workflow-input-form.ts';
import {
  useResetWorkbenchCacheVal,
  useSetWorkbenchCacheVal,
  useWorkbenchCacheVal,
} from '@/store/workbenchFormInputsCacheStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const BOOLEAN_VALUES = ['true', 'yes', '是', '1'];

export type TTabularEvent =
  | 'reset'
  | 'restore-previous-param'
  | 'submit'
  | { type: 'paste-param'; data: VinesWorkflowExecutionInput[] };

interface ITabularRenderProps {
  inputs: VinesWorkflowVariable[];
  height?: number;
  isLoading?: boolean;

  children?: React.ReactNode;
  fieldChildren?: React.ReactNode;

  onSubmit?: (data: IWorkflowInputForm) => void;
  onFormChange?: () => void;

  formClassName?: string;
  scrollAreaClassName?: string;
  itemClassName?: string;

  miniMode?: boolean;

  event$?: EventEmitter<TTabularEvent>;
  workflowId?: string;

  extra?: Record<string, any>;
  originalInputImages?: string[]; // 添加原始输入图片属性
}

export const TabularRender: React.FC<ITabularRenderProps> = ({
  inputs,
  height,
  isLoading = false,

  children,
  fieldChildren,

  onSubmit,
  onFormChange,

  formClassName,
  scrollAreaClassName,
  itemClassName,

  miniMode = false,

  event$,
  workflowId,

  extra = {},
  originalInputImages = [],
}) => {
  const { t } = useTranslation();

  const form = useForm<IWorkflowInputForm>({
    resolver: zodResolver(workflowInputFormSchema),
  });

  const [defValues, setDefValues] = useState<IWorkflowInputForm>({});
  const [initValues, setInitValues] = useState<IWorkflowInputForm>({});

  const { watch } = form;
  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();
  const resetWorkbenchCacheVal = useResetWorkbenchCacheVal();
  const workbenchCacheVal = useWorkbenchCacheVal(workflowId ?? '');
  const useFormResetRef = useRef<boolean>(false);

  const [hasRestoreValues, setHasRestoreValues] = useState(false);

  const pathName = useRouterState({
    select: (state) => state.location.pathname,
  });
  const inImageDetailRoute = pathName.includes('/image-detail');
  useEffect(() => {
    if (workbenchCacheVal && !hasRestoreValues && !inImageDetailRoute) {
      useFormResetRef.current = true;
      // setDefValues(workbenchCacheVal);
      setInitValues(workbenchCacheVal);
      form.reset(workbenchCacheVal);
      setHasRestoreValues(true);
      useFormResetRef.current = false;
    }
  }, [workbenchCacheVal, hasRestoreValues, inImageDetailRoute]);
  useEffect(() => {
    if (!workflowId) return;
    if (inImageDetailRoute) return;
    const { unsubscribe } = watch((data) => {
      if (workflowId && !useFormResetRef.current) {
        setWorkbenchCacheVal(workflowId, data);
      }
    });
    return () => unsubscribe();
  }, [watch, workflowId, setWorkbenchCacheVal]);

  useEffect(() => {
    if (!inputs) return;
    const targetInputs = inputs.filter(({ default: v }) => typeof v !== 'undefined');
    const defaultValues = fromPairs(
      targetInputs.map((it) => {
        const defValue = it.default;
        const type = it.type;
        const isMultiple = it.typeOptions?.multipleValues ?? false;

        if (type === 'number') {
          return [it.name, isMultiple ? ((defValue as string[]) ?? []).map((it) => Number(it)) : Number(defValue ?? 0)];
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

    for (const it of targetInputs) {
      if (it.typeOptions?.enableSelectList) {
        const selectList =
          (it.typeOptions?.selectList ?? []).find((item: any) => item.value === it.default)?.linkage ?? [];
        if (isArray(selectList) && selectList?.length) {
          for (const { name, value } of selectList) {
            set(defaultValues, name, value);
          }
        }
      }
    }

    setDefValues(defaultValues);

    if (!inImageDetailRoute && (!workbenchCacheVal || Object.keys(workbenchCacheVal).length === 0)) {
      form.reset(defaultValues);
    } else if (!inImageDetailRoute) {
      form.reset(initValues);
    } else {
      form.reset(defaultValues);
    }
  }, [inputs]);

  // 监听表单值变化
  useEffect(() => {
    const subscription = form.watch(() => {
      onFormChange?.();
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  // 计算当前隐藏的字段
  const getHiddenFields = useCallback(() => {
    const formValues = form.getValues();
    return inputs
      .filter((input) => {
        const { visibility } = input.typeOptions || {};
        if (!visibility?.conditions?.length) return false;

        const { conditions, logic } = visibility;
        const results = conditions.map(({ field, operator: _operator, value }) => {
          const fieldValue = formValues[field];
          return fieldValue === value;
        });

        const isVisible = logic === 'AND' ? results.every(Boolean) : results.some(Boolean);

        return !isVisible;
      })
      .map((input) => input.name);
  }, [inputs, form]);

  const handleSubmit = form.handleSubmit((data) => {
    // 获取当前隐藏的字段
    const hiddenFields = getHiddenFields();

    // 处理隐藏字段的值
    const processedData = { ...data };
    hiddenFields.forEach((fieldName) => {
      processedData[fieldName] = undefined;
    });

    for (const inputDef of inputs) {
      const { name, required, type, displayName } = inputDef;
      const value = processedData[name];

      // 跳过隐藏字段的必填验证
      if (hiddenFields.includes(name)) continue;

      if (required && isEmpty(value)) {
        toast.warning(t('workspace.flow-view.execution.workflow-input-is-required', { name: displayName }));
        return;
      }

      if (type === 'boolean' && isArray(value)) {
        processedData[name] = value.map((it: string | number | boolean) =>
          BOOLEAN_VALUES.includes(it?.toString() ?? ''),
        );
      }
    }
    onSubmit?.(processedData);
  });

  const { trigger: triggerGetExecutions } = useMutationSearchWorkflowExecutions();
  const latestValues = useLatest(defValues);
  event$?.useSubscription((event) => {
    if (typeof event === 'string') {
      switch (event) {
        case 'reset':
          resetWorkbenchCacheVal(workflowId ?? '');
          form.reset(latestValues.current);
          break;
        case 'restore-previous-param':
          if (workflowId) {
            toast.promise(
              triggerGetExecutions({
                pagination: { page: 1, limit: 10 },
                orderBy: { filed: 'startTime', order: 'DESC' },
                workflowId,
              }),
              {
                loading: t('workspace.form-view.quick-toolbar.restore-previous-param.loading'),
                success: (data) => {
                  if (data) {
                    form.reset(omit(data?.data?.[0]?.input, '__context'));
                    return t('workspace.form-view.quick-toolbar.restore-previous-param.success');
                  }
                  return t('workspace.form-view.quick-toolbar.restore-previous-param.prev-param-empty');
                },
                error: t('workspace.form-view.quick-toolbar.restore-previous-param.error'),
              },
            );
          } else {
            toast.error(t('workspace.wrapper.workflow-info-card.workflow-id-empty'));
          }
          break;
        case 'submit':
          void handleSubmit();
          break;
        default:
          break;
      }
    } else if (typeof event === 'object') {
      if (event.type === 'paste-param') {
        for (const inputDef of event.data) {
          const { id, data } = inputDef;
          form.setValue(id, data as unknown as any);
        }
        toast.success(t('common.toast.paste-success'));
      }
    }
  });

  const [loadingDialog, setLoadingDialog] = useState<string | null>(null);

  const { trigger: getWorkflowInstanceByImageUrl } = useWorkflowInstanceByImageUrl(workflowId);
  const { run: handleFillDataByImageUrl } = useDebounceFn(
    async (imageUrl: string, eventWorkflowId: string, autoProduce?: boolean) => {
      if (workflowId === eventWorkflowId) {
        setLoadingDialog(t('workspace.chat-view.workflow-mode.is-getting-input'));
        const { instance } = (await getWorkflowInstanceByImageUrl({ imageUrl })) as TWorkflowInstanceByImageUrl;
        if (instance) {
          const values = (instance?.input ?? {}) as unknown as IWorkflowInputForm;
          setDefValues(values);
          form.reset(values);
          if (autoProduce) {
            setTimeout(() => handleSubmit(), 200);
          }
        }
        setLoadingDialog(null);
      }
    },
    {
      wait: 200,
    },
  );
  useEffect(() => {
    VinesEvent.on('form-fill-data-by-image-url', handleFillDataByImageUrl);
    return () => {
      VinesEvent.off('form-fill-data-by-image-url', handleFillDataByImageUrl);
    };
  }, []);

  const { foldInputs, defInputs } = useMemo(
    () =>
      groupBy(inputs, (it) => (it?.typeOptions?.foldUp ? 'foldInputs' : 'defInputs')) as Record<
        string,
        VinesWorkflowVariable[]
      >,
    [inputs],
  );

  const [linkageMap, { set: setLinkage }] = useMap<string, IWorkflowInputSelectListLinkage>([]);
  const linkage = Array.from(linkageMap ?? []).flatMap((it) => it[1]);

  const hasFoldInputs = foldInputs?.length > 0;
  const isFormEmpty = !defInputs?.length && !hasFoldInputs;

  return (
    <Form {...form}>
      <form
        className={cn('relative flex flex-col gap-4', formClassName)}
        onSubmit={handleSubmit}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      >
        <AnimatePresence>
          {loadingDialog && (
            <VinesFullLoading
              motionKey="form-full-screen-tips"
              key="form-full-screen-tips"
              tips={loadingDialog}
              className="backdrop-blur-sm"
            />
          )}
          {isLoading ? (
            <VinesLoading className="vines-center absolute left-0 top-0 size-full" />
          ) : isFormEmpty ? (
            <motion.div
              className="vines-center absolute left-0 top-0 size-full flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0 }}
            >
              <Workflow size={64} />
              <Label className="text-sm">{t('workspace.chat-view.workflow-mode.empty-input.completed')}</Label>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <ScrollArea className={scrollAreaClassName} style={{ height }} disabledOverflowMask>
          <div className={cn('grid grid-cols-2 items-start gap-4', formClassName)}>
            {defInputs?.map((it, i) => (
              <VinesFormFieldItem
                it={it}
                form={form}
                itemClassName={itemClassName}
                key={i}
                defValues={defValues}
                miniMode={miniMode}
                extra={extra}
                originalInputImages={originalInputImages}
                linkage={linkage}
                setLinkage={setLinkage}
              />
            ))}
            {hasFoldInputs && (
              <Accordion className="col-span-2" type="single" collapsible>
                <AccordionItem value="more">
                  <AccordionTrigger className="justify-start gap-2 px-4 text-sm [&[data-state=open]_.chevron]:rotate-90">
                    {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.fold')}
                    <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-2 gap-4">
                    {foldInputs?.map((it, i) => (
                      <VinesFormFieldItem
                        it={it}
                        form={form}
                        itemClassName={itemClassName}
                        key={'fold_' + i}
                        defValues={defValues}
                        miniMode={miniMode}
                        extra={extra}
                        originalInputImages={originalInputImages}
                        linkage={linkage}
                        setLinkage={setLinkage}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            {fieldChildren}
          </div>
        </ScrollArea>
        {children}
      </form>
    </Form>
  );
};
