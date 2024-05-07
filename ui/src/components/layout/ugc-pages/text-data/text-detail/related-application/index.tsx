import React from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { CircleSlash } from 'lucide-react';

import { useSearchReferenceWorkflows } from '@/apis/ugc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IRelatedApplicationProps {
  textId: string;
}

export const RelatedApplication: React.FC<IRelatedApplicationProps> = ({ textId }) => {
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
            <h2 className="font-bold">暂无已关联的工作流</h2>
            <p className="mt-2 text-xs text-muted-foreground">可通过在工作流中使用「搜索增强」工具与其关联</p>
          </div>
        </>
      )}
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">图标</TableHead>
          <TableHead>工作流名称</TableHead>
          <TableHead>工作流描述</TableHead>
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
                {displayName}
              </a>
            </TableCell>
            <TableCell>{description}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
