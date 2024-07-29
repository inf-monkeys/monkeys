import React from 'react';

import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CommonSetting } from '@/components/layout/workspace/custom-setting/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface IWorkspaceCustomSettingProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkspaceCustomSetting: React.FC<IWorkspaceCustomSettingProps> = () => {
  const { t } = useTranslation();

  const visibleCustomSetting = usePageStore((s) => s.visibleCustomSetting);
  const setVisibleCustomSetting = usePageStore((s) => s.setVisibleCustomSetting);

  return (
    <motion.div
      key="vines-pages-custom-setting"
      initial={{ opacity: 0 }}
      variants={{
        visible: { opacity: 1, transition: { duration: 0.2 } },
        hidden: { opacity: 0, transition: { duration: 0.2 } },
      }}
      animate={visibleCustomSetting ? 'visible' : 'hidden'}
      className={cn(
        'absolute left-0 top-0 z-[1100] flex size-full flex-col gap-4 bg-slate-1 p-6',
        !visibleCustomSetting && 'pointer-events-none z-0',
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('workspace.wrapper.settings.label')}</h2>
        <Button icon={<XCircle />} onClick={() => setVisibleCustomSetting(false)} variant="outline">
          {t('workspace.wrapper.settings.close')}
        </Button>
      </div>
      <Tabs
        defaultValue="common"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="common" className="text-xs">
            {t('workspace.wrapper.settings.common.label')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="common">
          <CommonSetting />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
