import React from 'react';

import { isEmpty } from 'lodash';

import { IVinesChatListItem } from '@/components/layout/view/vines-chat/list/typings.ts';
import { VinesAbstractDataPreview } from '@/components/layout/vines-execution/data-display/abstract';
import { WorkflowInputList } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Card } from '@/components/ui/card.tsx';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';
export const VirtualizedItem = (_index: number, data: IVinesChatListItem) => {
  const inputs = data.input;
  const hasInput = inputs.length > 0;
  const hasOriginalInput = !isEmpty(data.originalInput);

  const botPhoto = data.botPhoto;
  const userPhoto = data.userPhoto;
  const userName = data.userName;

  const finalData = data.output as JSONValue;

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex w-full max-w-full flex-row-reverse gap-4">
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <Card className={cn('text-md p-4', hasInput && 'min-w-80')}>
          {hasInput ? (
            <WorkflowInputList
              inputs={inputs}
              defaultValueText={''}
              cardClassName="p-0 border-transparent shadow-transparent"
            />
          ) : hasOriginalInput ? (
            stringify(data.originalInput)
          ) : (
            '手动执行触发'
          )}
        </Card>
      </div>
      <div className="flex flex-row items-start gap-4">
        <VinesIcon size="sm">{botPhoto}</VinesIcon>
        <Card className="p-4">
          <VinesAbstractDataPreview data={finalData} />
        </Card>
      </div>
    </div>
  );
};
