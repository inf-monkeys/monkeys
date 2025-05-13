import React, { createRef, useEffect, useState } from 'react';

import { Meta, Uppy } from '@uppy/core';
import { useEventEmitter, useMemoizedFn } from 'ahooks';
import { PencilRuler } from 'lucide-react';
import { Cropper, ReactCropperElement } from 'react-cropper';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IVinesImageEditorProps } from '@/components/ui/image-editor/index.tsx';
import { base64toFile } from '@/components/ui/image-editor/utils.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { nanoIdLowerCase } from '@/utils';

const VinesImageEditor: React.FC<IVinesImageEditorProps> = ({
  width = 500,
  fileName,
  value,
  onChange,
  children,
  aspectRatio,
  tooltipI18nKey,
}) => {
  const { t } = useTranslation();

  const cropperRef = createRef<ReactCropperElement>();

  const [visible, setVisible] = useState(false);

  const [tempImage, setTempImage] = useState(value);

  useEffect(() => {
    if (value) {
      setTempImage(value);
    }
  }, [value]);

  const [uppy, setUppy] = React.useState<Uppy<Meta, Record<string, never>> | null>(null);
  const uppy$ = useEventEmitter<Uppy<Meta, Record<string, never>>>();
  uppy$.useSubscription((uppyObject) => {
    if (!uppy) {
      setUppy(uppyObject);
    }
  });

  const [loading, setLoading] = useState(false);
  const [imageEditorVisible, setImageEditorVisible] = useState(false);

  const handleImageEditSave = async () => {
    setLoading(true);

    const avatarB64 = cropperRef.current?.cropper.getCroppedCanvas()?.toDataURL();
    if (avatarB64) {
      const finalFileName = `${fileName ? fileName.split('.')[0] : nanoIdLowerCase(8)}.png`;
      const file = base64toFile(avatarB64, finalFileName);
      if (file && uppy) {
        uppy.removeFiles(uppy.getFiles().map((it) => it.id));
        setTimeout(() => uppy.addFile(file), 100);
      }
    }

    setImageEditorVisible(false);
    setLoading(false);
  };

  const handleSave = useMemoizedFn(() => {
    if (tempImage && onChange) {
      onChange(tempImage);
      toast.success(t('components.ui.image-editor.success'));
    } else {
      toast.error(t('components.ui.image-editor.error'));
    }
    setVisible(false);
  });

  return (
    <Tooltip>
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogTrigger asChild>
          <TooltipTrigger>{children}</TooltipTrigger>
        </DialogTrigger>
        <DialogContent
          onPointerDownOutside={(e) => {
            if (e.target instanceof Element && e.target.closest('[data-sonner-toast]')) {
              e.preventDefault();
            }
            handleSave();
          }}
        >
          <DialogTitle>{t('components.ui.image-editor.title')}</DialogTitle>
          <VinesUploader
            accept={['png', 'jpg', 'jpeg', 'webp', 'bmp']}
            maxSize={10}
            max={1}
            files={tempImage ? [tempImage] : []}
            onChange={(urls) => setTempImage(urls[0])}
            uppy$={uppy$}
            basePath="user-files/base"
          >
            <Dialog open={imageEditorVisible} onOpenChange={setImageEditorVisible}>
              <DialogTrigger asChild>
                <Button variant="outline" icon={<PencilRuler />} disabled={loading}>
                  {t('components.ui.image-editor.edit')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <Cropper
                  aspectRatio={aspectRatio}
                  width={width}
                  ref={cropperRef}
                  src={tempImage}
                  guides={true}
                  className="h-80 overflow-hidden rounded"
                  autoCropArea={1}
                  viewMode={1}
                  checkCrossOrigin={false}
                  crossOrigin="anonymous"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={handleImageEditSave} loading={loading}>
                    {t('common.utils.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" loading={loading} onClick={handleSave}>
              {t('common.utils.save')}
            </Button>
          </VinesUploader>
        </DialogContent>
      </Dialog>
      <TooltipContent>{t(tooltipI18nKey || 'components.ui.image-editor.confirm-tooltip')}</TooltipContent>
    </Tooltip>
  );
};

export default VinesImageEditor;
