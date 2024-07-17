import React from 'react';

import { ChevronRightIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

import { FieldDesc } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/desc.tsx';
import { FieldName } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/name.tsx';
import { FieldTips } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/accordion/tips.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldAccordionProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldAccordion: React.FC<IFieldAccordionProps> = ({ form }) => {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="more">
        <AccordionTrigger className="justify-start gap-2 text-sm [&[data-state=open]_.chevron]:rotate-90">
          高级配置
          <ChevronRightIcon className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <FieldDesc form={form} />
          <FieldTips form={form} />
          <FieldName form={form} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
