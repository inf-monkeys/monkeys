import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion';
import { useMap } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { t } from 'i18next';
import { groupBy, isArray, isEmpty } from 'lodash';
import { ChevronRightIcon, Sparkles, Workflow } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { executeTemporaryWorkflow, getTemporaryWorkflow, useTemporaryWorkflowResult } from '@/apis/temporary-workflow';
import { TemporaryWorkflow } from '@/apis/temporary-workflow/typings';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form.tsx';
import { Label } from '@/components/ui/label';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings';
import { IWorkflowInputSelectListLinkage } from '@/schema/workspace/workflow-input';
import { IWorkflowInputForm, workflowInputFormSchema } from '@/schema/workspace/workflow-input-form';
import { cn, getI18nContent } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution';
import { evaluateVisibilityCondition } from '@/utils/visibility';

import { ExecutionResultItem } from '../../workspace/vines-view/form/execution-result/grid/item';
import { BOOLEAN_VALUES } from '../../workspace/vines-view/form/tabular/render';
import { VinesFormFieldItem } from '../../workspace/vines-view/form/tabular/render/item';

interface TemporaryWorkflowOverlayProps {
  temporaryWorkflowId?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: 'normal' | 'fast' | 'mini';
}

export const TemporaryWorkflowOverlay: React.FC<TemporaryWorkflowOverlayProps> = ({
  temporaryWorkflowId,
  open,
  setOpen,
  mode,
}) => {
  // const { data: temporaryWorkflow, isLoading } = useGetTemporaryWorkflow(open ? temporaryWorkflowId : undefined);

  const [temporaryWorkflow, setTemporaryWorkflow] = useState<TemporaryWorkflow | undefined>(undefined);

  const [isExecuting, setIsExecuting] = useState(false);

  const [timer, setTimer] = useState(2000);

  const { data: result } = useTemporaryWorkflowResult(isExecuting && open ? temporaryWorkflowId : undefined, timer);

  const navigate = useNavigate();

  const isMiniFrame = mode === 'mini';

  const height = 'calc(100vh-4rem)';

  const form = useForm<IWorkflowInputForm>({
    resolver: zodResolver(workflowInputFormSchema),
  });

  const inputs = temporaryWorkflow?.inputData ?? [];

  const defValues = temporaryWorkflow?.inputData
    ? temporaryWorkflow.inputData.reduce(
        (prev, curr) => {
          prev[curr.name] = curr.default;
          return prev;
        },
        {} as Record<string, any>,
      )
    : {};

  // useEffect(() => {
  //   if (temporaryWorkflow) {
  //     if (temporaryWorkflow.status === 'COMPLETED') {
  //       navigate({
  //         search: (prev) => {
  //           return {
  //             ...prev,
  //             temporaryWorkflowId: undefined,
  //           };
  //         },
  //       });
  //       setOpen(false);
  //       return;
  //     }
  //     for (const input of temporaryWorkflow.inputData) {
  //       form.setValue(
  //         input.name,
  //         input.default as string | number | boolean | string[] | number[] | boolean[] | undefined,
  //       );
  //     }
  //   }
  // }, [temporaryWorkflow]);

  useEffect(() => {
    if (result && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(result.status)) {
      setTimer(0);
    }
  }, [result]);

  useEffect(() => {
    if (open && temporaryWorkflowId) {
      getTemporaryWorkflow(temporaryWorkflowId).then((resp) => {
        if (resp && resp.status === 'PENDING') {
          setTemporaryWorkflow(resp);
          for (const input of resp.inputData) {
            form.setValue(
              input.name,
              input.default as string | number | boolean | string[] | number[] | boolean[] | undefined,
            );
          }
        } else {
          navigate({
            search: (prev) => {
              return {
                ...prev,
                temporaryWorkflowId: undefined,
              };
            },
          });
          setOpen(false);
        }
      });
    }
  }, [open]);

  // 计算当前隐藏的字段
  const getHiddenFields = useCallback(() => {
    const formValues = form.getValues();
    return inputs
      .filter((input) => {
        const { visibility } = input.typeOptions || {};
        if (!visibility?.conditions?.length) return false;

        const { conditions, logic } = visibility;
        const results = conditions.map(({ field, operator, value }) => {
          const fieldValue = formValues[field];
          return evaluateVisibilityCondition(fieldValue, operator, value);
        });

        // 反转逻辑：当条件成立时隐藏字段
        const conditionsMet = logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
        return conditionsMet; // 条件成立时返回true（需要隐藏）
      })
      .map((input) => input.name);
  }, [inputs, form]);

  const handleSubmit = form.handleSubmit((data) => {
    if (!temporaryWorkflowId) return;

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
        toast.warning(
          t('workspace.flow-view.execution.workflow-input-is-required', { name: getI18nContent(displayName) }),
        );
        return;
      }

      if (type === 'boolean' && isArray(value)) {
        processedData[name] = value.map((it: string | number | boolean) =>
          BOOLEAN_VALUES.includes(it?.toString() ?? ''),
        );
      }
    }

    toast.promise(
      executeTemporaryWorkflow(temporaryWorkflowId, processedData).then((resp) => {
        if (resp) {
          if (resp.workflowInstanceId) {
            return resp;
          } else {
            throw new Error();
          }
        }
      }),
      {
        loading: t('common.create.loading'),
        success: () => {
          setIsExecuting(true);
          return t('common.create.success');
        },
        error: t('common.create.error'),
      },
    );
  });

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

  const { data: oem } = useSystemConfig();

  const clickBehavior = oem?.theme?.workflowPreviewExecutionGrid?.clickBehavior || 'preview';

  return temporaryWorkflowId ? (
    <VinesFlowProvider workflowId={temporaryWorkflowId}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn('min-h-64 pb-8', mode === 'mini' && 'flex h-full flex-col')}>
          {isExecuting ? (
            result && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(result.status) ? (
              <div className="grid max-h-[calc(100vh-4rem)] grid-cols-2 gap-global overflow-y-auto">
                {result.output.map((it) => {
                  return (
                    <ExecutionResultItem
                      key={it.key}
                      result={
                        {
                          ...result,
                          render: {
                            ...it,
                          },
                        } as unknown as IVinesExecutionResultItem
                      }
                      clickBehavior={clickBehavior}
                    />
                  );
                })}
              </div>
            ) : (
              <VinesLoading className="vines-center absolute left-0 top-0 size-full" />
            )
          ) : (
            <>
              <div>
                <Form {...form}>
                  <form
                    className={cn(
                      'flex flex-col gap-global',
                      isMiniFrame && 'absolute z-20 size-full bg-slate-1 p-global transition-opacity',
                    )}
                    onSubmit={handleSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  >
                    <AnimatePresence>
                      {isFormEmpty ? (
                        <motion.div
                          className="vines-center absolute left-0 top-0 size-full flex-col gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { delay: 0.2 } }}
                          exit={{ opacity: 0 }}
                        >
                          <Workflow size={64} />
                          <Label className="text-sm">
                            {t('workspace.chat-view.workflow-mode.empty-input.completed')}
                          </Label>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <ScrollArea style={{ height }} disabledOverflowMask>
                      <div className={cn('grid grid-cols-2 items-start gap-global')}>
                        {defInputs?.map((it, i) => (
                          <VinesFormFieldItem
                            it={it}
                            form={form}
                            key={i}
                            defValues={defValues}
                            miniMode={isMiniFrame}
                            originalInputImages={[]}
                            linkage={linkage}
                            setLinkage={setLinkage}
                          />
                        ))}
                        {hasFoldInputs && (
                          <Accordion className="col-span-2" type="single" collapsible>
                            <AccordionItem value="more">
                              <AccordionTrigger className="justify-start gap-2 px-global text-sm [&[data-state=open]_.chevron]:rotate-90">
                                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.fold')}
                                <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                              </AccordionTrigger>
                              <AccordionContent className="grid grid-cols-2 gap-global">
                                {foldInputs?.map((it, i) => (
                                  <VinesFormFieldItem
                                    it={it}
                                    form={form}
                                    key={'fold_' + i}
                                    defValues={defValues}
                                    miniMode={isMiniFrame}
                                    linkage={linkage}
                                    setLinkage={setLinkage}
                                  />
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    </ScrollArea>
                  </form>
                </Form>
              </div>
              <Button
                variant="solid"
                className="h-[36px] text-base"
                onClick={handleSubmit}
                size="small"
                icon={<Sparkles className="fill-white" />}
              >
                {t('workspace.pre-view.actuator.execution.label')}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </VinesFlowProvider>
  ) : (
    <></>
  );
};
