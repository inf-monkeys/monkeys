import React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Import, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ImportComfyUIWorkflow } from '@/components/layout/ugc-pages/tools/import-tool/comfyui';
import { ImportToolWithManifest } from '@/components/layout/ugc-pages/tools/import-tool/monkeys-tool';
import { ImportToolService } from '@/components/layout/ugc-pages/tools/import-tool/restful-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent } from '@/components/ui/tabs.tsx';

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
      <DialogContent className="max-h-[calc(100vh-10rem)] max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.tools.import.label')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="comfyui">
          <TabsPrimitive.List className="flex items-center gap-4">
            <TabsPrimitive.Trigger value="comfyui" asChild>
              <Card className="w-full cursor-pointer outline outline-transparent data-[state=active]:outline-vines-500">
                <CardContent className="flex items-center gap-4 p-4 text-left">
                  <div className="vines-center size-10 rounded-md bg-[#dec5c2]">
                    <Palette size={18} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h1 className="text-sm font-bold">{t('ugc-page.tools.import.tabs.comfyui.label')}</h1>
                    <span className="text-xxs font-normal text-gray-10">
                      {t('ugc-page.tools.import.tabs.comfyui.desc')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger value="restful-api" asChild>
              <Card className="w-full cursor-pointer outline outline-transparent data-[state=active]:outline-vines-500">
                <CardContent className="flex items-center gap-4 p-4 text-left">
                  <div className="vines-center size-10 rounded-md bg-[#dec5c2]">
                    <Palette size={18} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h1 className="text-sm font-bold">{t('ugc-page.tools.import.tabs.restful-api.label')}</h1>
                    <span className="text-xxs font-normal text-gray-10">
                      {t('ugc-page.tools.import.tabs.restful-api.desc')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger value="monkeys-tool" asChild>
              <Card className="w-full cursor-pointer outline outline-transparent data-[state=active]:outline-vines-500">
                <CardContent className="flex items-center gap-4 p-4 text-left">
                  <div className="vines-center size-10 rounded-md bg-[#dec5c2]">
                    <Palette size={18} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h1 className="text-sm font-bold">{t('ugc-page.tools.import.tabs.monkeys-tool.label')}</h1>
                    <span className="text-xxs font-normal text-gray-10">
                      {t('ugc-page.tools.import.tabs.monkeys-tool.desc')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsPrimitive.Trigger>
          </TabsPrimitive.List>
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
