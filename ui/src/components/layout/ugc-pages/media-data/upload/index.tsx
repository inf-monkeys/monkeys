import React from 'react';

import { useSWRConfig } from 'swr';

import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Uploader } from '@/components/ui/updater';

interface IUploadMediaProps {}

export const UploadMedia: React.FC<IUploadMediaProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Upload />}>
          {t('ugc-page.media-data.ugc-view.subtitle.upload.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>{t('ugc-page.media-data.ugc-view.subtitle.upload.title')}</DialogTitle>
        <Uploader
          maxSize={30}
          accept={[
            'image/png',
            'image/jpeg',
            'image/jpg',
            'text/plain',
            'application/pdf',
            'text/csv',
            'application/json',
            'application/ld+json',
            'application/zip',
          ]}
          onFinished={() => {
            void mutate((key) => typeof key === 'string' && key.startsWith('/api/media-files'));
          }}
          basePath="user-files/media"
          mode="embed"
        />
      </DialogContent>
    </Dialog>
  );
};
