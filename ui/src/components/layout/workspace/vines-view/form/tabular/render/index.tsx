/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLatest } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { AnimatePresence, motion } from 'framer-motion';
import { fromPairs, groupBy, isArray, omit } from 'lodash';
import { ChevronRightIcon, Workflow } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useMutationSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { VinesFormFieldItem } from '@/components/layout/workspace/vines-view/form/tabular/render/item.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { Form } from '@/components/ui/form.tsx';
import { Label } from '@/components/ui/label.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm, workflowInputFormSchema } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

export const BOOLEAN_VALUES = ['true', 'yes', '是', '1'];

export type TTabularEvent = 'reset' | 'restore-previous-param' | 'submit';

interface ITabularRenderProps {
  inputs: VinesWorkflowVariable[];
  height?: number;

  children?: React.ReactNode;
  fieldChildren?: React.ReactNode;

  onSubmit?: (data: IWorkflowInputForm) => void;

  formClassName?: string;
  scrollAreaClassName?: string;
  itemClassName?: string;

  miniMode?: boolean;

  event$?: EventEmitter<TTabularEvent>;
  workflowId?: string;

  extra?: Record<string, any>;
}

export const TabularRender: React.FC<ITabularRenderProps> = ({
  inputs,
  height,

  children,
  fieldChildren,

  onSubmit,

  formClassName,
  scrollAreaClassName,
  itemClassName,

  miniMode = false,

  event$,
  workflowId,

  extra = {},
}) => {
  const { t } = useTranslation();

  const form = useForm<IWorkflowInputForm>({
    resolver: zodResolver(workflowInputFormSchema),
  });

  const [defValues, setDefValues] = useState<IWorkflowInputForm>({});

  useEffect(() => {
    if (!inputs) return;
    const defaultValues = fromPairs(
      inputs
        .filter(({ default: v }) => typeof v !== 'undefined')
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

    setDefValues(defaultValues);

    form.reset(defaultValues);
  }, [inputs]);

  const handleSubmit = form.handleSubmit((data) => {
    for (const [key, value] of Object.entries(data)) {
      if (isArray(value)) {
        if (inputs?.find((it) => it.name === key)?.type === 'boolean') {
          data[key] = value.map((it: string | number | boolean) => BOOLEAN_VALUES.includes(it?.toString() ?? ''));
        }
      }
    }
    onSubmit?.(data);
  });

  const { trigger: triggerGetExecutions } = useMutationSearchWorkflowExecutions();
  const latestValues = useLatest(defValues);
  event$?.useSubscription((event) => {
    switch (event) {
      case 'reset':
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
  });

  const { foldInputs, defInputs } = useMemo(
    () =>
      groupBy(inputs, (it) => (it?.typeOptions?.foldUp ? 'foldInputs' : 'defInputs')) as Record<
        string,
        VinesWorkflowVariable[]
      >,
    [inputs],
  );

  const hasFoldInputs = foldInputs?.length > 0;
  const isFormEmpty = !defInputs?.length && !hasFoldInputs;

  return (
    <Form {...form}>
      <form
        className={cn('relative -mx-3 flex flex-col gap-4', formClassName)}
        onSubmit={handleSubmit}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      >
        <AnimatePresence>
          {isFormEmpty && (
            <motion.div
              className="vines-center absolute left-0 top-0 size-full flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Workflow size={64} />
              <Label className="text-sm">{t('workspace.chat-view.workflow-mode.empty-input.completed')}</Label>
            </motion.div>
          )}
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
              />
            ))}
            {hasFoldInputs && (
              <Accordion className="col-span-2" type="single" collapsible>
                <AccordionItem value="more">
                  <AccordionTrigger className="justify-start gap-2 px-3 text-sm [&[data-state=open]_.chevron]:rotate-90">
                    {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.fold')}
                    <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-2 gap-4 pt-6">
                    {foldInputs?.map((it, i) => (
                      <VinesFormFieldItem
                        it={it}
                        form={form}
                        itemClassName={itemClassName}
                        key={'fold_' + i}
                        defValues={defValues}
                        miniMode={miniMode}
                        extra={extra}
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
