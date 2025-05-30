import React from 'react';

import { CircleSlash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSearchReferenceWorkflows } from '@/apis/ugc';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
import { getI18nContent } from '@/utils';

interface IRelatedApplicationProps {
  textId: string;
}

export const RelatedApplication: React.FC<IRelatedApplicationProps> = ({ textId }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useSearchReferenceWorkflows('knowledge-base', textId);

  const isEmpty = !data || data.length === 0;
  const { teamId } = useVinesTeam();

  return isEmpty || isLoading ? (
    <div className="vines-center size-full flex-col">
      {isLoading ? (
        <VinesLoading />
      ) : (
        <>
          <CircleSlash size={64} />
          <div className="mt-4 flex flex-col text-center">
            <h2 className="font-bold">{t('common.load.empty')}</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('ugc-page.text-data.detail.tabs.associated-workflows.description')}
            </p>
          </div>
        </>
      )}
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">{t('components.layout.ugc.detail.workflows.columns.icon.label')}</TableHead>
          <TableHead>{t('components.layout.ugc.detail.workflows.columns.displayName.label')}</TableHead>
          <TableHead>{t('components.layout.ugc.detail.workflows.columns.description.label')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map(({ iconUrl, displayName, workflowId }, i) => (
          <TableRow key={i}>
            <TableCell>
              <VinesIcon size="sm">{iconUrl || DEFAULT_WORKFLOW_ICON_URL}</VinesIcon>
            </TableCell>
            <TableCell className="font-medium">
              <a
                className="hover:text-primary-500 transition-colors"
                href={`/${teamId}/workspace/${workflowId}`}
                target="_blank"
                rel="noreferrer"
              >
                {getI18nContent(displayName)}
              </a>
            </TableCell>
            <TableCell>{getI18nContent(displayName)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
