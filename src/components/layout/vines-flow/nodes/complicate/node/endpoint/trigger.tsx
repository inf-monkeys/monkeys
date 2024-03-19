import React from 'react';

import { ComplicateNodeHeader } from '@/components/layout/vines-flow/nodes/complicate/node/header.tsx';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

export const ComplicateTriggerNode: React.FC = () => {
  return (
    <div className="absolute left-0 top-0 size-full">
      <ComplicateNodeHeader
        tool={{} as VinesToolDef}
        toolName="workflow_start"
        customData={{
          icon: 'emoji:🚀:#35363b',
          title: '开始',
          description: '开始节点',
        }}
      />
    </div>
  );
};
