import React from 'react';

import { useParams } from '@tanstack/react-router';

import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetDesignProject } from '@/apis/designs';
import { DesignProjectInfoEditor } from '@/components/layout/design-space/design-project-info-editor.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_DESIGN_PROJECT_ICON_URL } from '@/consts/icons.ts';
import { getI18nContent } from '@/utils';

interface IDesignProjectInfoCardProps {}

export const DesignProjectInfoCard: React.FC<IDesignProjectInfoCardProps> = () => {
  const { t } = useTranslation();

  const { designProjectId } = useParams({ from: '/$teamId/design/$designProjectId/$designBoardId/' });
  const { data } = useGetDesignProject(designProjectId);

  return (
    <Tooltip>
      <DesignProjectInfoEditor designProject={data}>
        <TooltipTrigger asChild>
          <div className="group flex cursor-pointer items-center gap-2.5">
            <VinesIcon size="sm">{data?.iconUrl || DEFAULT_DESIGN_PROJECT_ICON_URL}</VinesIcon>
            <div className="flex flex-col gap-0.5">
              <h1 className="font-bold leading-tight">{getI18nContent(data?.displayName)}</h1>
              {data?.description && <span className="text-xxs">{getI18nContent(data.description)}</span>}
            </div>

            <div className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-70">
              <Pencil size={12} />
            </div>
          </div>
        </TooltipTrigger>
      </DesignProjectInfoEditor>
      <TooltipContent>{t('agent.info.tip')}</TooltipContent>
    </Tooltip>
  );
};
