import React, { useCallback } from 'react';

import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import CodeEditorCore from '@/components/ui/code-editor/code-editor-lazy';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCopy } from '@/hooks/use-copy';
import { useReportStore } from '@/store/useReportStore';

export const ReportDialog: React.FC = () => {
  const { t } = useTranslation();
  const open = useReportStore((state) => state.open);
  const content = useReportStore((state) => state.content);
  const setOpen = useReportStore((state) => state.setOpen);
  const setContent = useReportStore((state) => state.setContent);

  const { copy } = useCopy();

  const handleCopy = useCallback(() => {
    if (content) {
      copy(content);
    }
  }, [content, copy]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="min-h-[60vh] max-w-[80vw]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{t('dev-tools.report.dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <CodeEditorCore height="50vh" language="json" data={content} onUpdate={setContent} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopy} icon={<Copy />} disabled={!content}>
            {t('common.utils.copy')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
