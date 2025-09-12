import React, { useEffect, useState } from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { useGetDesignAssociationList } from '@/apis/designs';
import { useWorkflowList } from '@/apis/workflow';
import { useAllWorkflowAssociationList } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getI18nContent } from '@/utils';

import { SelectedAsset, SelectedAssets } from '.';
interface ISelectionItem {
  id: string;
  displayName: string | I18nValue | null;
  preferAppId?: string | null;
  assetType: 'workflow' | 'workflow-association' | 'design-association';
  selected: boolean;
}

interface IWorkflowAssociationItem extends ISelectionItem {
  originWorkflowId: string;
  targetWorkflowId?: string;
  type: IWorkflowAssociation['type'];
}

interface IExportAssetSelectProps {
  onSelect: (assets: SelectedAssets) => void;
}

export const ExportAssetSelect: React.FC<IExportAssetSelectProps> = ({ onSelect }) => {
  const { t } = useTranslation();

  // 数据列表
  const [workflows, setWorkflows] = useState<ISelectionItem[]>([]);
  const [workflowAssociations, setWorkflowAssociations] = useState<IWorkflowAssociationItem[]>([]);
  const [designAssociations, setDesignAssociations] = useState<ISelectionItem[]>([]);

  // 获取数据
  const { data: workflowList } = useWorkflowList({ page: 1, limit: 9999 });
  const { data: workflowAssociationList } = useAllWorkflowAssociationList();
  const { data: designAssociationList } = useGetDesignAssociationList();

  // 初始化数据
  useEffect(() => {
    if (workflowList) {
      setWorkflows(
        workflowList.map((workflow) => ({
          id: workflow.id,
          displayName: workflow.displayName,
          assetType: 'workflow',
          selected: false,
          preferAppId: workflow.preferAppId,
        })),
      );
    }
  }, [workflowList]);

  useEffect(() => {
    if (workflowAssociationList) {
      setWorkflowAssociations(
        workflowAssociationList.map((association) => ({
          id: association.id,
          displayName: association.displayName || null,
          assetType: 'workflow-association',
          selected: false,
          originWorkflowId: association.originWorkflowId,
          targetWorkflowId: association.type === 'to-workflow' ? association.targetWorkflowId : undefined,
          type: association.type,
          preferAppId: association.preferAppId,
        })),
      );
    }
  }, [workflowAssociationList]);

  useEffect(() => {
    if (designAssociationList) {
      setDesignAssociations(
        designAssociationList.map((association) => ({
          id: association.id,
          displayName: association.displayName,
          assetType: 'design-association',
          selected: false,
          preferAppId: association.preferAppId,
        })),
      );
    }
  }, [designAssociationList]);

  // 处理工作流选择
  const handleWorkflowSelect = (id: string, checked: boolean) => {
    setWorkflows((prev) => prev.map((item) => (item.id === id ? { ...item, selected: checked } : item)));
  };

  // 处理工作流关联选择
  const handleWorkflowAssociationSelect = (id: string, checked: boolean) => {
    // 更新工作流关联的选择状态
    setWorkflowAssociations((prev) => prev.map((item) => (item.id === id ? { ...item, selected: checked } : item)));

    // 找到对应的工作流关联
    const association = workflowAssociations.find((item) => item.id === id);
    if (association) {
      // 自动选择相关的工作流
      setWorkflows((prev) =>
        prev.map((workflow) => ({
          ...workflow,
          selected:
            workflow.selected ||
            (checked &&
              (workflow.id === association.originWorkflowId ||
                (association.type === 'to-workflow' && workflow.id === association.targetWorkflowId))),
        })),
      );
    }
  };

  // 处理设计关联选择
  const handleDesignAssociationSelect = (id: string, checked: boolean) => {
    setDesignAssociations((prev) => prev.map((item) => (item.id === id ? { ...item, selected: checked } : item)));
  };

  useEffect(() => {
    const selectedWorkflows = workflows.filter((item) => item.selected);
    const selectedWorkflowAssociations = workflowAssociations.filter((item) => item.selected);
    const selectedDesignAssociations = designAssociations.filter((item) => item.selected);

    onSelect([
      ...selectedWorkflows.map(
        (item) =>
          ({
            id: item.id,
            type: 'workflow',
            preferAppId: item.preferAppId,
            displayName: item.displayName,
          }) as SelectedAsset,
      ),
      ...selectedWorkflowAssociations.map(
        (item) =>
          ({
            id: item.id,
            type: 'workflow-association',
            preferAppId: item.preferAppId,
            displayName: item.displayName,
          }) as SelectedAsset,
      ),
      ...selectedDesignAssociations.map(
        (item) =>
          ({
            id: item.id,
            type: 'design-association',
            preferAppId: item.preferAppId,
            displayName: item.displayName,
          }) as SelectedAsset,
      ),
    ]);
  }, [workflows, workflowAssociations, designAssociations]);

  const renderSelectionList = (
    title: string,
    items: ISelectionItem[],
    onSelect: (id: string, checked: boolean) => void,
  ) => (
    <div className="flex-1 space-y-global-1/2">
      <h3 className="text-sm font-medium">{title}</h3>
      <Card className="p-global">
        <ScrollArea className="flex h-[200px] flex-col pr-4">
          {items.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger>
                <div className="flex w-full items-center gap-global-1/2">
                  <Checkbox
                    id={item.id}
                    checked={item.selected}
                    onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
                  />
                  <label htmlFor={item.id} className="text-sm">
                    {getI18nContent(item.displayName)}
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col">
                  <span>
                    {item.assetType} - {getI18nContent(item.displayName)}
                  </span>
                  <span>{item.id}</span>
                  <span>{item.preferAppId || 'no prefer app id'}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </ScrollArea>
      </Card>
    </div>
  );

  return (
    <div className="flex w-full justify-between gap-global">
      {renderSelectionList(t('common.type.workflow'), workflows, handleWorkflowSelect)}
      <Separator orientation="vertical" />
      {renderSelectionList(
        t('common.type.workflow-association'),
        workflowAssociations,
        handleWorkflowAssociationSelect,
      )}
      <Separator orientation="vertical" />
      {renderSelectionList(t('common.type.design-association'), designAssociations, handleDesignAssociationSelect)}
    </div>
  );
};
