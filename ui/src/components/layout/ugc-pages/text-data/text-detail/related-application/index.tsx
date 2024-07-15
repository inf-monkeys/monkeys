import React from 'react';

import { CircularProgress } from '@/components/ui/circular-progress';
import { CircleSlash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSearchReferenceWorkflows } from '@/apis/ugc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

interface IRelatedApplicationProps {
  textId: string;
}

export const RelatedApplication: React.FC<IRelatedApplicationProps> = ({ textId }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useSearchReferenceWorkflows('knowledge-base', textId);

  const isEmpty = !data || data.length === 0;
  const teamId = localStorage.getItem('vines-team-id');

  return isEmpty || isLoading ? (
    <div className="vines-center size-full flex-col">
      {isLoading ? (
        <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
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
        {data?.map(({ iconUrl, displayName, workflowId, description }, i) => (
          <TableRow key={i}>
            <TableCell>
              <VinesIcon size="sm">{iconUrl || 'emoji:🍀:#ceefc5'}</VinesIcon>
            </TableCell>
            <TableCell className="font-medium">
              <a
                className="transition-colors hover:text-primary-500"
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
