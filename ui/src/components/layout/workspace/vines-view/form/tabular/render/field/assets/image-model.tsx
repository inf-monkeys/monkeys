import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useComfyuiModelListByTypeNameAndServerId } from '@/apis/comfyui-model';
import { IComfyuiModel } from '@/apis/comfyui-model/typings.ts';
import { FormControl, FormMessage } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_ASSET_ICON_URL } from '@/consts/icons.ts';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface IFieldImageModelProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;

  filter?: (model: IComfyuiModel) => boolean;
}

export const FieldImageModel: React.FC<IFieldImageModelProps> = ({
  input: { typeOptions },
  value,
  onChange,
  filter,
}) => {
  const { t } = useTranslation();

  const { data: rawModels, isLoading } = useComfyuiModelListByTypeNameAndServerId(
    typeOptions?.comfyuiModelTypeName,
    typeOptions?.comfyuiModelServerId,
  );

  const models = (rawModels ?? [])
    .filter((m) => m.serverRelations.some((r) => r.server.id === typeOptions?.comfyuiModelServerId))
    .filter(filter ?? (() => true));

  const { ref, width } = useElementSize();
  const enableMaxWidth = width > 200;

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
              <SelectTrigger ref={ref}>
                <SelectValue placeholder={t('workspace.pre-view.actuator.execution-form.image-model.placeholder')} />
              </SelectTrigger>
              <SelectContent style={enableMaxWidth ? { maxWidth: width + 25 } : {}}>
                <SelectItem value=" ">不使用模型</SelectItem>
                {models.flatMap(({ id, displayName, iconUrl, serverRelations, description }) => {
                  const validRelations = serverRelations.filter(
                    (r) => r.server.id === typeOptions?.comfyuiModelServerId,
                  );

                  return validRelations.map((relation) => {
                    const apiPath = relation.apiPath;
                    return (
                      <Tooltip key={`${id}-${apiPath}`}>
                        <TooltipTrigger asChild>
                          <SelectItem value={apiPath}>
                            <div className="flex w-full items-center gap-2">
                              <VinesIcon src={iconUrl || DEFAULT_ASSET_ICON_URL} size="xs" />
                              <div className="flex-1">
                                <p className="break-all text-sm font-bold leading-4">{displayName ?? 'unknown'}</p>
                              </div>
                              {relation.type && relation.type.length > 0 && (
                                <div className="flex gap-1">
                                  {relation.type.map((type) => (
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
                        {description && <TooltipContent>{description}</TooltipContent>}
                      </Tooltip>
                    );
                  });
                })}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
