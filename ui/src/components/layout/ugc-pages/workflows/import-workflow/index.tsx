import React, { useCallback, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createWorkflow, importWorkflowByZip } from '@/apis/workflow';
import { IImportWorkflowResult } from '@/components/layout/ugc-pages/workflows/import-workflow/typings.ts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { uploadSingleFile } from '@/components/ui/vines-uploader/standalone';

export interface IImportWorkflowDialogProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onImportSuccess?: (result: IImportWorkflowResult) => void;
}

export const ImportWorkflowDialog: React.FC<IImportWorkflowDialogProps> = ({
  visible,
  setVisible,
  onImportSuccess,
}) => {
  const { t } = useTranslation();

  const [importMode, setImportMode] = useState<'file' | 'json'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.vines') && !fileName.endsWith('.zip') && !fileName.endsWith('.json')) {
        toast.error('请选择有效的文件格式（.vines, .zip 或 .json）');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (importMode === 'file' && !selectedFile) {
      toast.warning('请先选择要导入的文件');
      return;
    }

    if (importMode === 'json' && !jsonText.trim()) {
      toast.warning('请输入 JSON 内容');
      return;
    }

    setImporting(true);

    try {
      let result: IImportWorkflowResult;

      if (importMode === 'file' && selectedFile) {
        // 检测文件类型
        const fileName = selectedFile.name.toLowerCase();
        const isJson = fileName.endsWith('.json');

        if (isJson) {
          // JSON 文件：读取内容后调用 createWorkflow
          const fileContent = await selectedFile.text();
          let workflowData: Partial<MonkeyWorkflow>;

          try {
            workflowData = JSON.parse(fileContent);
          } catch (error) {
            toast.error('JSON 文件格式错误，请检查文件内容');
            setImporting(false);
            return;
          }

          result = await createWorkflow(workflowData);
        } else {
          // ZIP/VINES 文件：先上传，再调用 importWorkflowByZip
          const uploadResult = await uploadSingleFile(selectedFile, {
            basePath: 'workflow-import',
            onProgress: (progress) => {
              setUploadProgress(progress);
            },
          });

          if (!uploadResult.urls || uploadResult.urls.length === 0) {
            toast.error('文件上传失败，请重试');
            setImporting(false);
            return;
          }

          const zipUrl = uploadResult.urls[0];
          result = await importWorkflowByZip({ zipUrl });
        }
      } else {
        // JSON 文本模式
        let workflowData: Partial<MonkeyWorkflow>;

        try {
          workflowData = JSON.parse(jsonText);
        } catch (error) {
          toast.error('JSON 格式错误，请检查输入内容');
          setImporting(false);
          return;
        }

        result = await createWorkflow(workflowData);
      }

      // 处理导入结果
      if (result.warnings && result.warnings.length > 0) {
        toast.warning(
          <div>
            <div className="font-semibold">导入成功，但有以下警告：</div>
            <ul className="mt-2 list-inside list-disc text-xs">
              {result.warnings.slice(0, 5).map((warning, index) => (
                <li key={index} className="truncate">
                  {warning}
                </li>
              ))}
              {result.warnings.length > 5 && <li>还有 {result.warnings.length - 5} 条警告...</li>}
            </ul>
          </div>,
          {
            duration: 10000,
          },
        );
      } else {
        toast.success('工作流导入成功');
      }

      onImportSuccess?.(result);
      setVisible(false);

      // 重置状态
      setSelectedFile(null);
      setJsonText('');
      setUploadProgress(0);
    } catch (error: any) {
      console.error('导入工作流失败:', error);
      toast.error(error.message || '导入失败，请检查文件格式后重试');
    } finally {
      setImporting(false);
    }
  }, [importMode, selectedFile, jsonText, onImportSuccess, setVisible]);

  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!importing) {
        setVisible(open);
        if (!open) {
          // 重置状态
          setSelectedFile(null);
          setJsonText('');
          setUploadProgress(0);
          setImportMode('file');
        }
      }
    },
    [importing, setVisible],
  );

  return (
    <Dialog open={visible} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.workflow.import-dialog.title', '导入工作流')}</DialogTitle>
          <DialogDescription>
            {t('ugc-page.workflow.import-dialog.description', '支持导入 .vines、.zip 或 .json 格式的工作流文件')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={importMode} onValueChange={(v) => setImportMode(v as 'file' | 'json')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">{t('ugc-page.workflow.import-dialog.tab.file', '文件导入')}</TabsTrigger>
            <TabsTrigger value="json">{t('ugc-page.workflow.import-dialog.tab.json', 'JSON 导入')}</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('ugc-page.workflow.import-dialog.file.label', '选择文件')}</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="relative w-full" disabled={importing} asChild>
                  <label className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedFile
                      ? selectedFile.name
                      : t('ugc-page.workflow.import-dialog.file.placeholder', '点击选择文件')}
                    <input
                      type="file"
                      className="hidden"
                      accept=".vines,.zip,.json"
                      onChange={handleFileChange}
                      disabled={importing}
                    />
                  </label>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('ugc-page.workflow.import-dialog.file.hint', '支持 .vines、.zip 或 .json 格式')}
              </p>
              {importing && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">上传中: {Math.round(uploadProgress)}%</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('ugc-page.workflow.import-dialog.json.label', 'JSON 内容')}</Label>
              <Textarea
                placeholder={t('ugc-page.workflow.import-dialog.json.placeholder', '粘贴工作流 JSON 配置...')}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="font-mono text-xs"
                rows={15}
                disabled={importing}
              />
              <p className="text-xs text-muted-foreground">
                {t('ugc-page.workflow.import-dialog.json.hint', '请粘贴完整的工作流 JSON 配置')}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => handleDialogClose(false)} disabled={importing}>
            {t('common.utils.cancel', '取消')}
          </Button>
          <Button variant="solid" loading={importing} onClick={handleImport}>
            {importing
              ? t('ugc-page.workflow.import-dialog.importing', '导入中...')
              : t('ugc-page.workflow.import-dialog.import', '开始导入')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
