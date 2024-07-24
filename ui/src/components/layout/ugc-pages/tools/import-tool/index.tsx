import React from 'react';

import { Import } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ImportComfyUIWorkflow } from '@/components/layout/ugc-pages/tools/import-tool/comfyui';
import { ImportToolWithManifest } from '@/components/layout/ugc-pages/tools/import-tool/monkeys-tool';
import { ImportToolService } from '@/components/layout/ugc-pages/tools/import-tool/restful-api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

interface IImportToolsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ImportTools: React.FC<IImportToolsProps> = () => {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Import />}>
          {t('ugc-page.tools.import.label')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.tools.import.label')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="comfyui">
          <TabsList className="data-[orientation=horizontal]:h-auto">
            <TabsTrigger value="comfyui" className="flex flex-col gap-1 p-2">
              <h1 className="text-sm font-bold">{t('ugc-page.tools.import.tabs.comfyui.label')}</h1>
              <span className="text-xxs font-normal text-gray-10">{t('ugc-page.tools.import.tabs.comfyui.desc')}</span>
            </TabsTrigger>
            <TabsTrigger value="restful-api" className="flex flex-col gap-1 p-2">
              <h1 className="text-sm font-bold">{t('ugc-page.tools.import.tabs.restful-api.label')}</h1>
              <span className="text-xxs font-normal text-gray-10">
                {t('ugc-page.tools.import.tabs.restful-api.desc')}
              </span>
            </TabsTrigger>
            <TabsTrigger value="monkeys-tool" className="flex flex-col gap-1 p-2">
              <h1 className="text-sm font-bold">{t('ugc-page.tools.import.tabs.monkeys-tool.label')}</h1>
              <span className="text-xxs font-normal text-gray-10">{t('ugc-page.tools.import.tabs.monkeys-tool.desc')}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="comfyui">
            <ImportComfyUIWorkflow />
          </TabsContent>
          <TabsContent value="restful-api">
            <ImportToolService />
          </TabsContent>
          <TabsContent value="monkeys-tool">
            <ImportToolWithManifest />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
