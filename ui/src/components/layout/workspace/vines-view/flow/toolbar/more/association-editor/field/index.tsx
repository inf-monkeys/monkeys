import React from 'react';

import { UseFormReturn } from 'react-hook-form';

import { FieldDescription } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/description.tsx';
import { FieldDisplayName } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/display-name.tsx';
import { FieldEnabled } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/enabled.tsx';
import { FieldIconUrl } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/icon-url.tsx';
import { FieldMapper } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/mapper.tsx';
import { FieldType } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/type.tsx';
import { FieldWorkflow } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/field/workflow.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association.ts';

interface IAssociationEditorFieldsProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

export const AssociationEditorFields: React.FC<IAssociationEditorFieldsProps> = ({ form }) => {
  const type = form.watch('type');
  return type === 'to-workflow' ? (
    <div className="flex gap-4">
      <ScrollArea className="-mx-3 h-[38rem] px-3">
        <div className="flex w-96 max-w-md flex-col gap-2 px-1">
          <FieldEnabled form={form} />
          <FieldIconUrl form={form} />
          <FieldDisplayName form={form} />
          <FieldDescription form={form} />
          <FieldType form={form} />
        </div>
      </ScrollArea>

      <ScrollArea className="-mx-3 h-[38rem] px-3">
        <div className="flex w-96 max-w-md flex-col gap-2 px-1">
          {type === 'to-workflow' && (
            <>
              <FieldWorkflow form={form} />
            </>
          )}
          <FieldMapper form={form} />
        </div>
      </ScrollArea>
    </div>
  ) : null;
};
