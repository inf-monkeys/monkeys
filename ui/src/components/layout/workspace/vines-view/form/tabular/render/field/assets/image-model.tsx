import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useComfyuiModelListByTypeNameAndServerId } from '@/apis/comfyui-model';
import { IComfyuiModelWithOneServerWithApiPath } from '@/apis/comfyui-model/typings.ts';
import { FormControl, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

interface IFieldImageModelProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
}

export const FieldImageModel: React.FC<IFieldImageModelProps> = ({ input: { typeOptions }, value, onChange }) => {
  const { t } = useTranslation();

  const { data: rawModels, isLoading } = useComfyuiModelListByTypeNameAndServerId(
    typeOptions?.comfyuiModelTypeName,
    typeOptions?.comfyuiModelServerId,
  );

  const models = (rawModels ?? [])
    .map(({ serverRelations, ...raw }) => {
      const serverRelation = serverRelations.find((r) => r.server.id === typeOptions?.comfyuiModelServerId);
      return {
        ...raw,
        serverRelation,
      };
    })
    .filter((m) => m.serverRelation) as IComfyuiModelWithOneServerWithApiPath[];

  return (
    <AnimatePresence mode="popLayout">
      {isLoading ? (
        <motion.div
          key="vines-image-model-loading"
          className="flex h-[76px] w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <VinesLoading size="md" />
        </motion.div>
      ) : (
        <motion.div
          key="vines-image-model"
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <FormControl>
            <Select onValueChange={onChange} value={value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('workspace.pre-view.actuator.execution-form.image-model.placeholder')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {models.map(({ id, displayName, iconUrl, serverRelation, description }, i) => (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <SelectItem value={serverRelation.apiPath}>
                        <div className="flex items-center gap-2">
                          <VinesIcon src={iconUrl || 'emoji:🍀:#ceefc5'} size="xs" />
                          <p className="text-sm font-bold">{displayName ?? 'unknown'}</p>
                          {serverRelation.type && serverRelation.type.length > 0 && (
                            <div className="flex gap-1">
                              {serverRelation.type.map((type) => (
                                <p
                                  key={type.id}
                                  className="text-xxs model-tag rounded border border-input bg-muted p-1"
                                >
                                  {type?.displayName ?? type?.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent side={i === 0 ? 'bottom' : 'top'}>
                      <span className="text-sm font-bold">
                        {t('workspace.pre-view.actuator.execution-form.image-model.tooltip.file-path') +
                          serverRelation.path}
                      </span>
                      <br />
                      {description}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
