import React from 'react';

import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';

import { Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useComfyuiModel } from '@/apis/comfyui-model';
import { UgcDetailInfo } from '@/components/layout/ugc/detail/info';
import { createImageModelsColumns } from '@/components/layout/ugc-pages/image-models/consts.tsx';
import { ImageModelServerRelations } from '@/components/layout/ugc-pages/image-models/detail/server-list';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IImageModelDetailProps {}

export const ImageModelDetail: React.FC<IImageModelDetailProps> = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { history } = useRouter();

  const { imageModelId } = Route.useParams();
  const { data: imageModel } = useComfyuiModel(imageModelId);

  return (
    <main className="flex size-full flex-col gap-4">
      <header className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={<Undo2 />}
              variant="outline"
              size="small"
              className="scale-85 -m-1 -ml-0.5 -mr-2"
              onClick={() => {
                history.back();
              }}
            />
          </TooltipTrigger>
          <TooltipContent>{t('common.utils.back')}</TooltipContent>
        </Tooltip>
        <h1 className="line-clamp-1 text-2xl font-bold">{t('ugc-page.image-models.detail.title')}</h1>
      </header>
      <UgcDetailInfo
        columns={createImageModelsColumns({
          hooks: {
            navigate,
          },
        })}
        data={imageModel}
        assetKey="image-models"
      />
      <ImageModelServerRelations relations={imageModel?.serverRelations ?? []} />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/image-models/$imageModelId/')({
  component: ImageModelDetail,
  beforeLoad: teamIdGuard,
});