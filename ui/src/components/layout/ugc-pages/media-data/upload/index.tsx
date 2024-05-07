import React from 'react';

import { useSWRConfig } from 'swr';

import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Updater } from '@/components/ui/updater';

interface IUploadMediaProps {}

export const UploadMedia: React.FC<IUploadMediaProps> = () => {
  const { mutate } = useSWRConfig();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Upload />}>
          上传文件
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[40rem] max-w-[40rem]">
        <DialogTitle>上传文件</DialogTitle>
        <Updater
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
        />
      </DialogContent>
    </Dialog>
  );
};
