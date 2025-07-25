import React, { useState } from 'react';

import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VinesUploader } from '@/components/ui/vines-uploader';

interface ImageUploadButtonProps {
  onImagesSelected: (imageUrls: string[]) => void;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({ onImagesSelected }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleUpload = (urls: string[]) => {
    setUploadedFiles(urls);
  };

  const handleConfirm = () => {
    if (uploadedFiles.length > 0) {
      onImagesSelected(uploadedFiles);
      setUploadedFiles([]);
      setIsOpen(false);
    } else {
      toast.error(t('workspace.chat-view.chat-bot.chat.no-image-selected'));
    }
  };

  const handleCancel = () => {
    setUploadedFiles([]);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        theme="tertiary"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Camera size={18} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.utils.upload')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-global">
            <VinesUploader
              max={1}
              accept={['jpg', 'jpeg', 'png', 'gif', 'webp']}
              files={uploadedFiles}
              onChange={handleUpload}
              autoUpload
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.utils.cancel')}
            </Button>
            <Button variant="solid" onClick={handleConfirm}>
              {t('common.utils.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
