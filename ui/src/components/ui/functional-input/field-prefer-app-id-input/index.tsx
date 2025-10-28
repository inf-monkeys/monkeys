import { useCallback } from 'react';

import { AssetType, I18nValue, MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { CaseSensitive } from 'lucide-react';
import { Path, PathValue, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getWorkflow } from '@/apis/workflow';
import { IWorkflowAssociationType } from '@/apis/workflow/association/typings';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { inferAppId } from '@/utils/infer-app-id';

interface IFieldPreferAppIdPropsBase {
  displayName?: string | I18nValue;
  preferAppId?: string;
  type?: IWorkflowAssociationType;
  targetWorkflowId?: string;
}

interface IFieldPreferAppIdProps<T extends IFieldPreferAppIdPropsBase> extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<T>;
  assetType: AssetType;
  workflowId?: string;
  scope?: 'global' | 'specific';
}

export const FieldPreferAppIdInput = <T extends IFieldPreferAppIdPropsBase>({
  form,
  assetType,
  workflowId,
  scope = 'specific',
}: IFieldPreferAppIdProps<T>) => {
  const { t } = useTranslation();

  const handleAutoGenerate = useCallback(async () => {
    // let enDisplayName = '';

    // if (assetType === 'workflow') {
    //   enDisplayName = getI18nContent(form.getValues('displayName' as Path<T>), '', 'en') ?? '';
    // } else if (assetType === 'workflow-association') {
    //   if (scope === 'specific' && workflowId) {
    //     const originWorkflow = await getWorkflow(workflowId);
    //     if (form.getValues('type' as Path<T>) === 'to-workflow') {
    //       const targetWorkflow = await getWorkflow(form.getValues('targetWorkflowId' as Path<T>) as string);
    //       enDisplayName =
    //         getI18nContent(originWorkflow?.displayName, '', 'en') +
    //         '-to-' +
    //         getI18nContent(targetWorkflow?.displayName, '', 'en');
    //     } else {
    //       enDisplayName = getI18nContent(originWorkflow?.displayName, '', 'en') + '-to-board';
    //     }
    //   } else if (scope === 'global') {
    //     if (form.getValues('type' as Path<T>) === 'to-workflow') {
    //       const targetWorkflow = await getWorkflow(form.getValues('targetWorkflowId' as Path<T>) as string);
    //       enDisplayName = 'global-to-' + getI18nContent(targetWorkflow?.displayName, '', 'en');
    //     } else {
    //       enDisplayName = 'global-to-board';
    //     }
    //   }
    // } else if (assetType === 'design-association') {
    //   enDisplayName = 'to-' + getI18nContent(form.getValues('displayName' as Path<T>), '', 'en');
    // }

    // const namePart = enDisplayName
    //   ?.toLowerCase()
    //   .replace(/[\s_\-.,，。？！!?:;；、~`'"“”‘’()[\]{}<>@#$%^&*+=\\/|]/g, '-');
    // const appId = `${namePart}-${assetType}`;

    let originWorkflow: MonkeyWorkflow | undefined;
    let targetWorkflow: MonkeyWorkflow | undefined;

    const type = form.getValues('type' as Path<T>) as IWorkflowAssociationType;

    if (assetType === 'workflow-association') {
      if (scope === 'specific' && workflowId) {
        originWorkflow = await getWorkflow(workflowId);
        if (type === 'to-workflow') {
          targetWorkflow = await getWorkflow(form.getValues('targetWorkflowId' as Path<T>) as string);
        }
      } else if (scope === 'global') {
        if (type === 'to-workflow') {
          targetWorkflow = await getWorkflow(form.getValues('targetWorkflowId' as Path<T>) as string);
        }
      }
    }

    const appId = inferAppId({
      displayName: form.getValues('displayName' as Path<T>) as string | I18nValue,
      assetType,
      scope,
      workflowId,
      type,
      targetWorkflow,
      originWorkflow,
    });
    form.setValue('preferAppId' as Path<T>, appId as PathValue<T, Path<T>>);
  }, [assetType, form]);

  return (
    <FormField
      name={'preferAppId' as Path<T>}
      control={form.control}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>{t('asset.prefer-app-id-input.label')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                value={field.value as string | undefined}
                onChange={field.onChange}
                placeholder={t('asset.prefer-app-id-input.placeholder')}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    icon={<CaseSensitive />}
                    variant="outline"
                    size="icon"
                    className="absolute inset-y-1 right-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toast.promise(handleAutoGenerate(), {
                        loading: t('asset.prefer-app-id-input.auto-generate.toast.loading'),
                        success: t('asset.prefer-app-id-input.auto-generate.toast.success'),
                        error: t('asset.prefer-app-id-input.auto-generate.toast.error'),
                      });
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('asset.prefer-app-id-input.auto-generate.tooltip')}</TooltipContent>
              </Tooltip>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
