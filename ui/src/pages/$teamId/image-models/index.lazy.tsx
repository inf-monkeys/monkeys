import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { LibraryBig, Package, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ComfyUIServerListModal } from 'src/components/layout/ugc-pages/comfyui/comfyui-server-list';

import { IComfyuiModelType } from '@/apis/comfyui-model/typings.ts';
import { preloadUgcImageModels, useUgcImageModels } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createImageModelsColumns } from '@/components/layout/ugc-pages/image-models/consts.tsx';
import { ImageModelManageDropdown } from '@/components/layout/ugc-pages/image-models/model-manage-dropdown';
import { ImageModelTypeModal } from '@/components/layout/ugc-pages/image-models/model-type-modal';
import { OperateArea } from '@/components/layout/ugc-pages/image-models/operate-area';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util';
import { Button } from '@/components/ui/button';
import { Tag } from '@/components/ui/tag';
import { useCopy } from '@/hooks/use-copy.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const ImageModels: React.FC = () => {
  const { t: tHook } = useTranslation();

  const { copy } = useCopy({ timeout: 500 });
  const iconOnlyMode = useGetUgcViewIconOnlyMode();
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="image-models"
        assetType="comfyui-model"
        assetName={tHook('components.layout.main.sidebar.list.model.image-models.label')}
        useUgcFetcher={useUgcImageModels}
        preloadUgcFetcher={preloadUgcImageModels}
        createColumns={() =>
          createImageModelsColumns({
            hooks: {
              navigate,
              copy,
            },
          })
        }
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
            </span>
          ),
          cover: (item) => {
            return RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' });
          },
          assetTags: (item) => {
            const types = item.serverRelations.reduce((acc: IComfyuiModelType[], { type }) => {
              if (type && type.length > 0) {
                type.forEach((t) => {
                  if (!acc.find((t1) => t1.name === t.name)) acc.push(t);
                });
              }
              return acc;
            }, []);
            return (
              <>
                {types.length === 0 ? (
                  <span className="text-xs">{tHook('ugc-page.image-models.types.other')}</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1 overflow-hidden text-xs">
                    {types.map((t) => {
                      return (
                        <Tag color="primary" size="xs" key={t.name}>
                          {t.displayName || t.name}
                        </Tag>
                      );
                    })}
                  </div>
                )}
              </>
            );
          },
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        subtitle={
          <>
            <ComfyUIServerListModal>
              <Button variant="outline" size="small" icon={<Server />}>
                {iconOnlyMode ? null : tHook('comfyui.comfyui-server.title')}
              </Button>
            </ComfyUIServerListModal>
            <ImageModelTypeModal>
              <Button variant="outline" size="small" icon={<LibraryBig />}>
                {iconOnlyMode ? null : tHook('comfyui.comfyui-model-type.title')}
              </Button>
            </ImageModelTypeModal>
            <ImageModelManageDropdown>
              <Button variant="outline" size="small" icon={<Package />}>
                {iconOnlyMode ? null : tHook('comfyui.comfyui-model.manage-dropdown.label')}
              </Button>
            </ImageModelManageDropdown>
          </>
        }
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/image-models/')({
  component: ImageModels,
});
