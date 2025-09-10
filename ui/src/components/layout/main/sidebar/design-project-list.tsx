import React from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { FolderClosed, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDesignProjectMetadataList, useGetDesignProjectList } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { useVinesTeam } from '@/components/router/guard/team';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn, getI18nContent } from '@/utils';

interface IDesignProjectListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const DesignProjectList: React.FC<IDesignProjectListProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId } = useVinesTeam();

  // 获取设计项目列表
  const { data: designProjects } = useGetDesignProjectList();

  // 从 URL query 获取当前选中的 project 和 board
  const { projectId } = useSearch({
    strict: false,
    select: (search: any) => ({
      projectId: search.projectId,
    }),
  });

  // 本地存储展开状态
  const [expandedProjects, setExpandedProjects] = useLocalStorage<string[]>('vines-ui-design-projects-expanded', []);

  const handleProjectClick = (project: IAssetItem<IDesignProject>) => {
    // 导航到设计项目页面，设置 projectId
    navigate({
      search: (prev) => ({
        ...prev,
        projectId: project.id,
        boardId: undefined, // 清除之前的 boardId
      }),
    });
  };

  const handleBoardClick = (project: IAssetItem<IDesignProject>, boardId: string) => {
    // 导航到具体的设计板页面
    navigate({
      to: '/$teamId/design/$designProjectId/$designBoardId/',
      params: {
        teamId,
        designProjectId: project.id,
        designBoardId: boardId,
      },
    });
  };

  const ProjectItem: React.FC<{ project: IAssetItem<IDesignProject> }> = ({ project }) => {
    const { data: boardList } = useDesignProjectMetadataList(project.id);

    const isProjectSelected = projectId === project.id;

    return (
      <AccordionItem key={project.id} value={project.id} className="border-none">
        <AccordionTrigger
          className={cn(
            'group w-full cursor-pointer select-none gap-2 rounded-lg border border-transparent p-2 text-xs hover:border-input/60 hover:bg-mauve-2/60 hover:bg-opacity-70',
            isProjectSelected ? 'border-input bg-mauve-2 font-bold' : '',
          )}
          onClick={() => handleProjectClick(project)}
        >
          <div className="flex items-center gap-1">
            <div className="w-[20px] [&_svg]:h-[16px] [&_svg]:w-[16px]">
              {boardList && boardList.length > 0 ? (
                <>
                  <FolderClosed className="group-data-[state=open]:hidden" size={16} />
                  <FolderOpen className="hidden group-data-[state=open]:block" size={16} />
                </>
              ) : (
                <FolderClosed size={16} />
              )}
            </div>
            <span className="text-sm">{getI18nContent(project.displayName)}</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="flex flex-col gap-1 first:mt-1">
          {boardList && boardList.length > 0 && (
            <>
              {boardList.map((board) => {
                return (
                  <div
                    key={board.id}
                    className={cn(
                      'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg border border-transparent p-2 text-xs hover:border-input/60 hover:bg-mauve-2/60 hover:bg-opacity-70',
                    )}
                    onClick={() => handleBoardClick(project, board.id)}
                  >
                    <div className="w-[20px] [&_svg]:h-[16px] [&_svg]:w-[16px]"></div>
                    <span className="text-sm">{getI18nContent(board.displayName)}</span>
                  </div>
                );
              })}
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (!designProjects || designProjects.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-4 text-sm text-muted-foreground', className)}>
        {t('common.utils.empty')}
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-full flex-1 overflow-y-scroll', className)} scrollBarDisabled>
      <Accordion
        type="multiple"
        className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70"
        value={expandedProjects}
        onValueChange={setExpandedProjects}
      >
        {designProjects.map((project) => (
          <ProjectItem key={project.id} project={project} />
        ))}
      </Accordion>
    </ScrollArea>
  );
};
