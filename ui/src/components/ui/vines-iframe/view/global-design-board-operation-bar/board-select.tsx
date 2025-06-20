import React, { useEffect, useMemo, useState } from 'react';

import { useSearch } from '@tanstack/react-router';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDesignProjectMetadataList, useGetDesignProjectList } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_DESIGN_PROJECT_ICON_URL, DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { cn, getI18nContent } from '@/utils';

const getDesignProjectDisplayName = (designProject?: IDesignProject) => {
  if (!designProject) return '';
  const displayName = getI18nContent(designProject.displayName ?? '');
  return (
    <span className="flex items-center gap-2">
      <VinesIcon src={designProject.iconUrl ?? DEFAULT_DESIGN_PROJECT_ICON_URL} size="xs" />
      <span className="max-w-[7.6rem] truncate">{displayName}</span>
    </span>
  );
};

export const GlobalDesignBoardOperationBarBoardSelect: React.FC = () => {
  const { t } = useTranslation();
  const { designProjectId: designProjectIdFromSearch, designBoardId: designBoardIdFromSearch } = useSearch({
    strict: false,
  }) as {
    designProjectId?: string;
    designBoardId?: string;
  };

  const [designProjectVisible, setDesignProjectVisible] = useState(false);
  const [designBoardVisible, setDesignBoardVisible] = useState(false);
  const { setDesignBoardId } = useDesignBoardStore();

  const { data: designProjectList, isLoading } = useGetDesignProjectList();

  const [currentDesignProjectId, setCurrentDesignProjectId] = useState<string | null>(
    designProjectIdFromSearch ?? null,
  );

  const selectedDesignProject = (designProjectList ?? []).find(
    (designProject) => designProject.id === currentDesignProjectId,
  );

  const { data: designBoardList, isLoading: isDesignBoardListLoading } =
    useDesignProjectMetadataList(currentDesignProjectId);

  const [currentDesignBoardId, setCurrentDesignBoardId] = useState<string | undefined>(
    designBoardIdFromSearch ?? undefined,
  );

  const selectedDesignBoard = (designBoardList ?? []).find((designBoard) => designBoard.id === currentDesignBoardId);

  useEffect(() => {
    if (currentDesignBoardId) {
      setDesignBoardId(currentDesignBoardId);
    }
  }, [currentDesignBoardId, setDesignBoardId]);

  useMemo(() => {
    if (currentDesignProjectId && designBoardList && designBoardList.length > 0) {
      setCurrentDesignBoardId(designBoardList[0].id);
    } else {
      setCurrentDesignBoardId(undefined);
    }
  }, [currentDesignProjectId, designBoardList]);

  useEffect(() => {
    if (designProjectIdFromSearch) {
      setCurrentDesignProjectId(designProjectIdFromSearch);
    }
    if (designBoardIdFromSearch) {
      setCurrentDesignBoardId(designBoardIdFromSearch);
    }
  }, [designProjectIdFromSearch, designBoardIdFromSearch]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-2">
        <span className="text-sm">{t('common.type.design-project')}</span>
        <Popover open={designProjectVisible} onOpenChange={setDesignProjectVisible}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn('w-full justify-between', !currentDesignProjectId && 'text-muted-foreground')}
            >
              {currentDesignProjectId
                ? getDesignProjectDisplayName(selectedDesignProject!)
                : isLoading
                  ? t('common.load.loading')
                  : t('workspace.global-design-board.operation-bar.design-project.placeholder')}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandInput
                placeholder={t('workspace.global-design-board.operation-bar.design-project.search-placeholder')}
              />
              <CommandEmpty>
                {t('workspace.global-design-board.operation-bar.design-project.search-empty')}
              </CommandEmpty>
              <ScrollArea className="h-64">
                <CommandGroup>
                  {(designProjectList ?? []).map((designProject) => (
                    <CommandItem
                      value={designProject.id}
                      key={designProject.id}
                      onSelect={() => {
                        setCurrentDesignProjectId(designProject.id);
                        setCurrentDesignBoardId(undefined);
                        setDesignProjectVisible(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          designProject.id === currentDesignProjectId ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <VinesIcon src={designProject.iconUrl || DEFAULT_WORKFLOW_ICON_URL} size="xs" />
                        <div className="flex flex-col">
                          <span className="font-medium">{getI18nContent(designProject.displayName)}</span>
                          {designProject.description && (
                            <span className="text-xs text-muted-foreground">
                              {getI18nContent(designProject.description)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex w-full flex-col gap-2">
        <span className="text-sm">{t('common.type.design-board')}</span>
        <Popover open={designBoardVisible} onOpenChange={setDesignBoardVisible}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn('w-full justify-between', !currentDesignBoardId && 'text-muted-foreground')}
            >
              {currentDesignBoardId
                ? getI18nContent(selectedDesignBoard!.displayName ?? '')
                : isLoading
                  ? t('common.load.loading')
                  : t('workspace.global-design-board.operation-bar.design-board.placeholder')}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandInput
                placeholder={t('workspace.global-design-board.operation-bar.design-board.search-placeholder')}
              />
              <CommandEmpty>{t('workspace.global-design-board.operation-bar.design-board.search-empty')}</CommandEmpty>
              <ScrollArea className="h-64">
                <CommandGroup>
                  {(designBoardList ?? []).map((designBoard) => (
                    <CommandItem
                      value={designBoard.id}
                      key={designBoard.id}
                      onSelect={() => {
                        setCurrentDesignBoardId(designBoard.id);
                        setDesignBoardVisible(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          designBoard.id === currentDesignBoardId ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{getI18nContent(designBoard.displayName)}</span>
                          {designBoard.description && (
                            <span className="text-xs text-muted-foreground">
                              {getI18nContent(designBoard.description)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
