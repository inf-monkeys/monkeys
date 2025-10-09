import React, { useEffect, useRef, useState } from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useGetDesignAssociationList } from '@/apis/designs';
import { useAllWorkflowList } from '@/apis/workflow';
import { useAllWorkflowAssociationList } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportAssetsDataSchema } from '@/schema/workspace/export-asset';
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

  // 文件导入
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = exportAssetsDataSchema.safeParse(json);
      if (!parsed.success) {
        toast.error('JSON 格式不符合 IExportAssets');
        return;
      }

      const assets = parsed.data;

      const workflowAppIds = new Set<string>(assets.filter((a) => a.type === 'workflow').map((a) => a.appId));
      const workflowAssociationAppIds = new Set<string>(
        assets.filter((a) => a.type === 'workflow-association').map((a) => a.appId),
      );
      const designAssociationAppIds = new Set<string>(
        assets.filter((a) => a.type === 'design-association').map((a) => a.appId),
      );

      // 从将要选择的关联里衍生需要选择的工作流
      const workflowIdsFromAssociations = new Set<string>();
      workflowAssociations.forEach((assoc) => {
        if (assoc.preferAppId && workflowAssociationAppIds.has(assoc.preferAppId)) {
          workflowIdsFromAssociations.add(assoc.originWorkflowId);
          if (assoc.type === 'to-workflow' && assoc.targetWorkflowId) {
            workflowIdsFromAssociations.add(assoc.targetWorkflowId);
          }
        }
      });

      setWorkflows((prev) =>
        prev.map((w) => {
          const byApp = !!w.preferAppId && workflowAppIds.has(w.preferAppId);
          const byAssoc = workflowIdsFromAssociations.has(w.id);
          return { ...w, selected: byApp || byAssoc };
        }),
      );

      setWorkflowAssociations((prev) =>
        prev.map((item) => ({
          ...item,
          selected: !!item.preferAppId && workflowAssociationAppIds.has(item.preferAppId),
        })),
      );

      setDesignAssociations((prev) =>
        prev.map((item) => ({
          ...item,
          selected: !!item.preferAppId && designAssociationAppIds.has(item.preferAppId),
        })),
      );

      toast.success('已根据导入的数据更新选择');
    } catch (err) {
      toast.error('读取或解析文件失败');
    } finally {
      // 允许重复选择同一文件
      if (e.target) e.target.value = '';
    }
  };

  // 获取数据
  const { data: workflowList } = useAllWorkflowList();
  const { data: workflowAssociationList } = useAllWorkflowAssociationList();
  const { data: designAssociationList } = useGetDesignAssociationList();

  // 初始化数据
  useEffect(() => {
    if (workflowList) {
      setWorkflows(
        workflowList.map((workflow) => ({
          id: workflow.workflowId,
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
        <ScrollArea className="flex h-[60vh] flex-col pr-4">
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
    <>
      <div className="flex w-full justify-between gap-global">
        <span>导入已有数据</span>
        <div className="flex items-center gap-global-1/2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={handleChooseFileClick}>
            选择文件
          </Button>
        </div>
      </div>
      <div className="flex h-full w-full justify-between gap-global">
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
    </>
  );
};
