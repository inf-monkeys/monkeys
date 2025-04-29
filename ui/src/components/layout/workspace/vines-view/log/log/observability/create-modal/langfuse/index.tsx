import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ICreateWorkflowObservability } from '@/schema/workspace/create-workflow-observability';

interface ICreateModalPlatformLangfuseFormProps {
  form: UseFormReturn<ICreateWorkflowObservability>;
}

export const CreateModalPlatformLangfuseForm: React.FC<ICreateModalPlatformLangfuseFormProps> = ({ form }) => {
  return (
    <>
      <FormField
        name="platformConfig.secretKey"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'workspace.logs-view.observability.workflow-create-modal.table.columns.platform-config.langfuse.secret-key.label',
              )}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t(
                  'workspace.logs-view.observability.workflow-create-modal.table.columns.platform-config.langfuse.secret-key.placeholder',
                )}
                {...field}
                className="grow"
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="platformConfig.publicKey"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'workspace.logs-view.observability.workflow-create-modal.table.columns.platform-config.langfuse.public-key.label',
              )}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t(
                  'workspace.logs-view.observability.workflow-create-modal.table.columns.platform-config.langfuse.public-key.placeholder',
                )}
                {...field}
                className="grow"
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="platformConfig.baseUrl"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t(
                'workspace.logs-view.observability.workflow-create-modal.table.columns.platform-config.langfuse.base-url.label',
              )}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t(
                  'workspace.logs-view.observability.workflow-create-modal.table.columns.platform-config.langfuse.base-url.placeholder',
                )}
                {...field}
                className="grow"
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
