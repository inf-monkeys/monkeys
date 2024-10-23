import React, { createRef, useEffect, useState } from 'react';

import { Cropper, ReactCropperElement } from 'react-cropper';
import { useTranslation } from 'react-i18next';
import { VinesUploader } from 'src/components/ui/uploader';

import { getResourceByMd5 } from '@/apis/resources';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IVinesImageEditorProps } from '@/components/ui/image-editor/index.tsx';
import { base64toFile } from '@/components/ui/image-editor/utils.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateMD5, uploadFile } from '@/components/ui/uploader/utils.ts';
import { nanoIdLowerCase } from '@/utils';

const VinesImageEditor: React.FC<IVinesImageEditorProps> = ({
  width = 500,
  fileName,
  value,
  onChange,
  children,
  aspectRatio,
}) => {
  const { t } = useTranslation();

  const cropperRef = createRef<ReactCropperElement>();

  const [visible, setVisible] = useState(false);

  const [tempImageMd5, setTempImageMd5] = useState('');
  const [tempImage, setTempImage] = useState(value);

  useEffect(() => {
    if (value) {
      setTempImage(value);
    }
  }, [value]);

  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    if (!onChange) {
      setVisible(false);
      return;
    }
    setLoading(true);

    let ossUrl: string = tempImage ?? '';

    const avatarB64 = cropperRef.current?.cropper.getCroppedCanvas()?.toDataURL();
    if (avatarB64) {
      const finalFileName = `${fileName ? fileName.split('.')[0] : nanoIdLowerCase(10)}.png`;
      const file = base64toFile(avatarB64, finalFileName);
      if (file) {
        const cropperMd5 = await calculateMD5(file, () => {});
        if (cropperMd5 !== tempImageMd5) {
          const existingFileUrl = (await getResourceByMd5(cropperMd5 as string))?.data?.url;
          if (existingFileUrl) {
            ossUrl = existingFileUrl;
          } else {
            ossUrl = await uploadFile(file, `images/${finalFileName}`, () => {});
          }
        }
      }
    }

    if (ossUrl !== value) {
      onChange(ossUrl);
    }

    setVisible(false);
    setLoading(false);
  };

  return (
    <Tooltip>
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogTrigger asChild>
          <TooltipTrigger>{children}</TooltipTrigger>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{t('components.ui.image-editor.title')}</DialogTitle>
          <Cropper
            aspectRatio={aspectRatio}
            width={width}
            ref={cropperRef}
            src={tempImage}
            guides={true}
            className="h-80 overflow-hidden rounded"
            autoCropArea={1}
            viewMode={1}
            preview={void 0}
            ready={() => {
              setTimeout(() => {
                try {
                  const avatarB64 = cropperRef.current?.cropper.getCroppedCanvas()?.toDataURL();
                  if (avatarB64) {
                    const file = base64toFile(avatarB64, `temp.png`);
                    if (file) {
                      calculateMD5(file, () => {}).then((md5) => {
                        setTempImageMd5(md5 as string);
                      });
                    }
                  }
                } catch {
                  /* empty */
                }
              });
            }}
            checkCrossOrigin={false}
            crossOrigin="anonymous"
          />

          <DialogFooter>
            <VinesUploader
              accept={['image/png', 'image/jpeg']}
              maxSize={10}
              limit={1}
              onFinished={(urls) => {
                setTempImage(urls[0]);
              }}
              basePath="user-files/base"
            >
              <Button variant="outline" disabled={loading}>
                {t('components.ui.image-editor.upload-others')}
              </Button>
            </VinesUploader>
            <Button variant="outline" onClick={handleSave} loading={loading}>
              {t('common.utils.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TooltipContent>{t('components.ui.image-editor.confirm-tooltip')}</TooltipContent>
    </Tooltip>
  );
};

export default VinesImageEditor;
