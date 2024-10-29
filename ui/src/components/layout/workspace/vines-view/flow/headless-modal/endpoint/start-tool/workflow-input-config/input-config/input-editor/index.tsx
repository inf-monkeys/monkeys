import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { get, isBoolean, isUndefined, omit, pick, set } from 'lodash';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FieldAccordion } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion';
import { FieldImageModelServerSelector } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/comfyui-model/server-selector.tsx';
import { FieldImageModelTypeSelector } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/comfyui-model/type-selector.tsx';
import { FieldDefaultValue } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/default-value';
import { FieldDisplayName } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/display-name.tsx';
import { FieldFile } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/file.tsx';
import { FieldNumber } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/number.tsx';
import { FieldSetRequired } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/set-required.tsx';
import { FieldType } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/type.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInput, workflowInputSchema } from '@/schema/workspace/workflow-input.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cloneDeep, cn, getI18nContent, nanoIdLowerCase } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IInputEditorProps {}

export const InputEditor: React.FC<IInputEditorProps> = () => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const workflowId = useFlowStore((s) => s.workflowId);

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
        form.reset({
          displayName: '',
          name: nanoIdLowerCase(6),
          type: 'string',
          default: '',
          multipleValues: false,
          assetType: '',
        });
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

    const defaultValues = {
      displayName: getI18nContent(currentVariable.displayName) ?? t('common.utils.unknown'),
      name: currentVariable.name,
      description: getI18nContent(currentVariable.description) ?? '',
      placeholder: get(currentVariable, 'typeOptions.placeholder', ''),
      tips: get(currentVariable, 'typeOptions.tips', ''),
      type: currentVariable.type as IWorkflowInput['type'],
      default: currentVariable.default as IWorkflowInput['default'],
      required: get(currentVariable, 'required', false),
      textareaMiniHeight: get(currentVariable, 'typeOptions.textareaMiniHeight', 40),
      multipleValues: get(currentVariable, 'typeOptions.multipleValues', false),
      assetType: get(currentVariable, 'typeOptions.assetType', ''),
      enableImageMask: get(currentVariable, 'typeOptions.enableImageMask', undefined),
      minValue: get(currentVariable, 'typeOptions.minValue', undefined),
      maxValue: get(currentVariable, 'typeOptions.maxValue', undefined),
      numberPrecision: get(currentVariable, 'typeOptions.numberPrecision', undefined),
      enableSelectList: get(currentVariable, 'typeOptions.enableSelectList', undefined),
      selectList: get(currentVariable, 'typeOptions.selectList', []),
      foldUp: get(currentVariable, 'typeOptions.foldUp', false),
      enableReset: get(currentVariable, 'typeOptions.enableReset', false),
      singleColumn: get(currentVariable, 'typeOptions.singleColumn', false),
      comfyuiModelServerId: get(currentVariable, 'typeOptions.comfyuiModelServerId', undefined),
      comfyuiModelTypeName: get(currentVariable, 'typeOptions.comfyuiModelTypeName', undefined),
    };

    form.reset(defaultValues);
  }, [currentVariable]);

  const handleSubmit = form.handleSubmit((data) => {
    const {
      multipleValues,
      assetType,
      enableImageMask,
      minValue,
      maxValue,
      numberPrecision,
      default: Default,
      textareaMiniHeight,
      placeholder,
      tips,
      selectList,
      enableSelectList,
      foldUp,
      enableReset,
      singleColumn,
      comfyuiModelServerId,
      comfyuiModelTypeName,
    } = pick(data, [
      'multipleValues',
      'assetType',
      'default',
      'textareaMiniHeight',
      'placeholder',
      'minValue',
      'maxValue',
      'numberPrecision',
      'enableImageMask',
      'tips',
      'enableSelectList',
      'selectList',
      'foldUp',
      'enableReset',
      'singleColumn',
      'comfyuiModelServerId',
      'comfyuiModelTypeName',
    ]);

    const finalVariable = omit(data, [
      'multipleValues',
      'assetType',
      'default',
      'placeholder',
      'textareaMiniHeight',
      'minValue',
      'maxValue',
      'numberPrecision',
      'enableImageMask',
      'tips',
      'enableSelectList',
      'selectList',
      'foldUp',
      'enableReset',
      'singleColumn',
      'comfyuiModelServerId',
      'comfyuiModelTypeName',
    ]);

    const setOption = (key: string, value: unknown) => {
      if (!isUndefined(value)) {
        set(finalVariable, `typeOptions.${key}`, value);
      }
    };

    setOption('multipleValues', multipleValues);
    setOption('assetType', assetType);
    setOption('enableImageMask', enableImageMask);
    setOption('minValue', minValue);
    setOption('maxValue', maxValue);
    setOption('numberPrecision', numberPrecision);
    setOption('tips', tips);
    setOption('enableSelectList', enableSelectList);
    setOption('selectList', selectList);
    setOption('foldUp', foldUp);
    setOption('enableReset', enableReset);
    setOption('singleColumn', singleColumn);
    setOption('comfyuiModelServerId', comfyuiModelServerId);
    setOption('comfyuiModelTypeName', comfyuiModelTypeName);
    setOption('placeholder', placeholder);
    setOption('textareaMiniHeight', textareaMiniHeight);

    if (Default) {
      set(finalVariable, 'default', Default);
    }

    if (finalVariable.type === 'boolean') {
      if (multipleValues) {
        set(
          finalVariable,
          'default',
          ((Default || []) as (boolean | string)[])?.map((it) =>
            isBoolean(it) ? it : ['true', '1', 'yes', '真', 't', 'T'].includes(it.toString()),
          ),
        );
      } else if (!isUndefined(Default)) {
        set(
          finalVariable,
          'default',
          isBoolean(Default) ? Default : ['true', '1', 'yes', '真', 't', 'T'].includes(Default.toString()),
        );
      }
    }

    const prevVariableName = currentVariable?.name;
    const nextVariableName = finalVariable?.name;
    if (!isUndefined(prevVariableName) && prevVariableName !== nextVariableName) {
      vines.update({
        variables: cloneDeep(vines.workflowInput).map((it) => {
          for (const selectItem of it.typeOptions?.selectList ?? []) {
            for (const linkageItem of selectItem?.linkage ?? []) {
              if (linkageItem.name === prevVariableName) {
                linkageItem.name = nextVariableName;
              }
            }
          }

          if (it.name === prevVariableName) {
            return finalVariable;
          }
          return it;
        }),
      });
    } else {
      vines.update({ variable: finalVariable as VinesWorkflowVariable });
    }

    setOpen(false);
  });

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  const { type, assetType } = form.getValues();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-auto max-w-6xl"
        onPointerDownOutside={(e) => {
          if (e.target instanceof Element && e.target.closest('[data-sonner-toast]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle>{t('workspace.flow-view.endpoint.start-tool.input.config-form.title')}</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          >
            <div className="flex gap-2">
              <ScrollArea className="-mx-3 h-[25rem] px-3">
                <div className="flex w-96 max-w-md flex-col gap-2 px-1">
                  <FieldDisplayName form={form} />
                  <FieldType form={form} forceUpdate={forceUpdate} />

                  {assetType === 'comfyui-model' && (
                    <>
                      <FieldImageModelServerSelector form={form} />
                      <FieldImageModelTypeSelector form={form} />
                    </>
                  )}

                  <FieldDefaultValue form={form} />

                  <FieldSetRequired form={form} />

                  <FieldAccordion form={form} />
                </div>
              </ScrollArea>
              {type === 'file' && <FieldFile form={form} />}

              {type === 'number' && <FieldNumber form={form} />}
            </div>

            <DialogFooter>
              <Button
                ref={submitButtonRef}
                type="submit"
                variant="outline"
                className={cn(!isLatestWorkflowVersion && 'hidden')}
              >
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
