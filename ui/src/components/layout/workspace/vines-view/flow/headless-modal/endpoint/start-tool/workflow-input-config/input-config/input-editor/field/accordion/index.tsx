import React from 'react';

import { ChevronRightIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FieldDesc } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/desc.tsx';
import { FieldEnableReset } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/enable-reset.tsx';
import { FieldFoldUp } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/fold-up.tsx';
import { FieldName } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/name.tsx';
import { FieldSingleColumn } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/single-column.tsx';
import { FieldTips } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/tips.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldAccordionProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldAccordion: React.FC<IFieldAccordionProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="more">
        <AccordionTrigger className="justify-start gap-2 text-sm [&[data-state=open]_.chevron]:rotate-90">
          {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.fold')}
          <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <FieldDesc form={form} />
          <FieldTips form={form} />
          <FieldName form={form} />
          <FieldFoldUp form={form} />
          <FieldEnableReset form={form} />
          <FieldSingleColumn form={form} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
