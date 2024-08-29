import React from 'react';

import { useTranslation } from 'react-i18next';

import { IComfyuiModelType, IComfyuiServerRelation } from '@/apis/comfyui-model/typings.ts';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IImageModelServerRelationsProps {
  relations: IComfyuiServerRelation[];
}

export const ImageModelServerRelations: React.FC<IImageModelServerRelationsProps> = ({ relations }) => {
  const { t } = useTranslation();
  return (
    <DataTable
      columns={[
        {
          id: 'serverAddress',
          accessorKey: 'server.address',
          header: t('comfyui.comfyui-server.table.columns.address.label'),
        },
        {
          id: 'serverDescription',
          accessorKey: 'server.description',
          header: t('comfyui.comfyui-server.table.columns.description.label'),
        },
        {
          id: 'path',
          accessorKey: 'path',
          header: t('comfyui.comfyui-model.table.columns.path.label'),
        },
        {
          id: 'filename',
          accessorKey: 'filename',
          header: t('comfyui.comfyui-model.table.columns.filename.label'),
        },
        {
          id: 'type',
          accessorKey: 'type',
          header: t('comfyui.comfyui-model.table.columns.type.label'),
          cell: ({ getValue }) => {
            const type = getValue() as IComfyuiModelType | undefined;
            return type ? (
              <Tooltip>
                <TooltipTrigger>{type?.displayName || type.name}</TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-1 p-1">
                    <div className="grid grid-cols-5 text-sm">
                      <span className="col-span-2 flex justify-start font-bold">
                        {t('comfyui.comfyui-model-type.table.columns.name.label')}
                      </span>
                      <span className="col-span-3 flex flex-wrap justify-end">{type.name}</span>
                    </div>
                    <div className="grid grid-cols-5 text-sm">
                      <span className="col-span-2 flex justify-start font-bold">
                        {t('comfyui.comfyui-model-type.table.columns.path.label')}
                      </span>
                      <span className="col-span-3 flex flex-wrap justify-end">{type.path}</span>
                    </div>
                    {type.displayName && (
                      <div className="grid grid-cols-5 text-sm">
                        <span className="col-span-2 flex justify-start font-bold">
                          {t('comfyui.comfyui-model-type.table.columns.display-name.label')}
                        </span>
                        <span className="col-span-3 flex flex-wrap justify-end">{type.displayName}</span>
                      </div>
                    )}
                    {type.description && (
                      <div className="grid grid-cols-5 text-sm">
                        <span className="col-span-2 flex justify-start font-bold">
                          {t('comfyui.comfyui-model-type.table.columns.description.label')}
                        </span>
                        <span className="col-span-3 flex flex-wrap justify-end">{type.description}</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              t('ugc-page.image-models.types.other')
            );
          },
        },
      ]}
      data={relations}
    />
  );
};
