import React from 'react';

import { UseFormReturn } from 'react-hook-form';

import { ScrollArea } from '@/components/ui/scroll-area';
import { IDesignAssociationForEditor } from '@/schema/workspace/design-association';

import { FieldDescription } from './description';
import { FieldDisplayName } from './display-name';
import { FieldEnabled } from './enabled';
import { FieldIconUrl } from './icon-url';
import { FieldTargetInputId } from './target-input-id';
import { FieldWorkflow } from './workflow';

interface IDesignAssociationEditorFieldsProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IDesignAssociationForEditor>;
}

export const DesignAssociationEditorFields: React.FC<IDesignAssociationEditorFieldsProps> = ({ form }) => {
  return (
    <div className="gap-global flex">
      <ScrollArea className="-mx-3 h-[38rem] px-3">
        <div className="flex w-96 max-w-md flex-col gap-2 px-1">
          <FieldEnabled form={form} />
          <FieldIconUrl form={form} />
          <FieldDisplayName form={form} />
          <FieldDescription form={form} />
          <FieldWorkflow form={form} />
          <FieldTargetInputId form={form} />
        </div>
      </ScrollArea>
    </div>
  );
};
