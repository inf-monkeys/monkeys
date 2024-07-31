import React, { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AppTypeSelector } from '@/components/layout/ugc-pages/apps/create/app-type/selector.tsx';
import { ICreateAppType } from '@/components/layout/ugc-pages/apps/create/app-type/typings.ts';
import { AgentCreateForm } from '@/components/layout/ugc-pages/apps/create/form/agent.tsx';
import { WorkflowCreateForm } from '@/components/layout/ugc-pages/apps/create/form/workflow.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';

export interface ICreateAppDialogProps {
  defaultSelect: ICreateAppType;
}

export const CreateAppDialog: React.FC<ICreateAppDialogProps> = ({ defaultSelect }) => {
  const { t } = useTranslation();

  const [selectedType, setSelectedType] = useState<ICreateAppType>(defaultSelect);

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="small" icon={<Plus />}>
          {t('common.utils.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[1200px]" style={{ transition: 'height 0.5s ease' }}>
        <DialogHeader>
          <DialogTitle>{t('ugc-page.app.create.dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="m-1">
          <div className="mb-4 flex flex-col gap-2">
            <span className="text-sm font-medium">{t('ugc-page.app.create.dialog.type.label')}</span>
            <AppTypeSelector selectedType={selectedType} onChange={setSelectedType} />
          </div>
          <AnimatePresence>
            <motion.div
              className="flex flex-col gap-4"
              key={selectedType}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {selectedType === 'workflow' && <WorkflowCreateForm setOpen={setOpen} />}
              {selectedType === 'agent' && <AgentCreateForm setOpen={setOpen} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
