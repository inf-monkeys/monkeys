import React, { useCallback, useEffect, useState } from 'react';

import { AssetType } from '@inf-monkeys/vines';
import { CircularProgress } from '@nextui-org/progress';
import { createColumnHelper } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { IBaseAsset } from '@/apis/ugc/asset-typings.ts';
import { exportWorkflow, useWorkflowRelatedAssets } from '@/apis/workflow';
import { IExportWorkflowWithAssetsContext } from '@/components/dialog/export-workflow/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';

export interface IExportWorkflowDialogProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  context?: IExportWorkflowWithAssetsContext;
}

export const ExportWorkflowDialog: React.FC<IExportWorkflowDialogProps> = ({ visible, setVisible, context }) => {
  const { teamId } = useVinesTeam();

  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [data, setData] = useState<IBaseAsset[]>([]);
  const [invalidAssetMessages, setInvalidAssetMessages] = useState<string[]>([]);

  const { data: relatedAssets } = useWorkflowRelatedAssets(context?.workflowId, context?.version);

  useEffect(() => {
    if (!relatedAssets || !context) return;
    setLoading(true);
    let assetsArray: IBaseAsset[] = [];
    if (relatedAssets.subWorkflows?.length) {
      assetsArray = assetsArray.concat(relatedAssets.subWorkflows);
    }
    if (relatedAssets.llmModels?.length) {
      assetsArray = assetsArray.concat(relatedAssets.llmModels);
    }
    if (relatedAssets.sdModels?.length) {
      assetsArray = assetsArray.concat(relatedAssets.sdModels);
    }
    if (relatedAssets.tableCollections?.length) {
      assetsArray = assetsArray.concat(relatedAssets.tableCollections);
    }
    if (relatedAssets.textCollections?.length) {
      assetsArray = assetsArray.concat(relatedAssets.textCollections);
    }
    setData(assetsArray);
    setInvalidAssetMessages(relatedAssets.invalidAssetMessages || []);
    setLoading(false);
  }, [relatedAssets]);

  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.display({
      id: 'icon',
      header: '图标',
      size: 64,
    }),
    columnHelper.display({
      id: 'name',
      header: '名称',
      cell: ({ row }) => <span>{row.original.displayName || row.original.name}</span>,
    }),
    columnHelper.display({
      id: 'type',
      header: '类型',
      size: 64,
      cell: ({ row }) => {
        const type = row.original.assetType;
        return (
          <span>
            {(type === 'workflow' && '子工作流') ||
              (type === 'sd-model' && '图像模型') ||
              (type === 'llm-model' && '文本模型') ||
              (type === 'table-collection' && '表格数据') ||
              (type === 'text-collection' && '文本数据') ||
              '其他'}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'operate',
      header: '操作',
      size: 32,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={<MoreHorizontal />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    const assetType: AssetType = row.original.assetType;
                    switch (assetType) {
                      case 'workflow':
                        handleOpenWorkflow(row.original.originalId);
                        break;
                      case 'llm-model':
                        handleOpenLlmModel();
                        break;
                      case 'sd-model':
                        handleOpenSdModel();
                        break;
                      case 'table-collection':
                        handleOpenTableCollection(row.original.originalId);
                        break;
                      case 'text-collection':
                        handleOpenTextCollection(row.original.originalId);
                        break;
                      default:
                        break;
                    }
                  }}
                >
                  查看
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const handleExport = useCallback(async () => {
    if (!context) {
      return;
    }
    setExporting(true);
    toast.promise(exportWorkflow(context.workflowId, context.name, context.version), {
      loading: '导出中...',
      success: () => {
        setVisible(false);
        return '导出成功';
      },
      error: '导出失败，请检查网络后重试',
      finally: () => {
        setExporting(false);
      },
    });
  }, [context]);

  const handleOpenWorkflow = useCallback((workflowId: string) => {
    if (typeof window !== 'undefined') {
      open(`/${teamId}/workspace/${workflowId}`, '_blank');
    }
  }, []);

  const handleOpenLlmModel = useCallback(() => {
    if (typeof window !== 'undefined') {
      open(`/${teamId}/model/llm`, '_blank');
    }
  }, []);

  const handleOpenSdModel = useCallback(() => {
    if (typeof window !== 'undefined') {
      open(`/${teamId}/model/sd`, '_blank');
    }
  }, []);

  const handleOpenTableCollection = useCallback((databaseId: string) => {
    if (typeof window !== 'undefined') {
      open(`/${teamId}/table/${databaseId}`, '_blank');
    }
  }, []);

  const handleOpenTextCollection = useCallback((collectionName: string) => {
    if (typeof window !== 'undefined') {
      open(`/${teamId}/text/${collectionName}`, '_blank');
    }
  }, []);
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{(context?.version ? '导出当前版本' : '导出全部版本') ?? '导出'}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="my-8 flex w-full select-none items-center justify-center gap-4 text-xs">
            <CircularProgress />
            <div className="opacity-70">加载此工作流关联的资产中</div>
          </div>
        ) : (
          <div>
            {data.length > 0 && (
              <div className="mb-2">
                <span>导出时会同时导出此工作流相关联的资产。</span>
              </div>
            )}
            {invalidAssetMessages?.length > 0 && (
              <div className="mb-2">
                <span>检测到工作流包含失效的资产，以下资产将不会被导出：</span>
                <div className="text-red-500">
                  <ul>
                    {invalidAssetMessages.map((message, index) => {
                      return <li key={index}>{message}</li>;
                    })}
                  </ul>
                </div>
              </div>
            )}
            <DataTable columns={columns} data={data} />
          </div>
        )}
        <DialogFooter>
          <Button>取消</Button>
          <Button variant="solid" loading={exporting} onClick={handleExport}>
            开始导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
