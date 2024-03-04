import React from 'react';

import { createFileRoute, redirect } from '@tanstack/react-router';

import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const WorkspacePage: React.FC = () => {
  return null;
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/$pageId/')({
  component: WorkspacePage,
  beforeLoad: async (opts) => {
    const pageId = opts.params.pageId;

    if (!z.string().refine(isMongoId).safeParse(pageId).success) {
      throw redirect({
        to: '/$teamId/workflows',
        params: {
          teamId: opts.params.teamId,
        },
      });
    }

    return teamIdGuard(opts);
  },
  validateSearch: z.object({
    to: z.string().optional(),
  }),
});
