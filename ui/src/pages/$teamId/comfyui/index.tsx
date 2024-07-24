import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const ComfyUI: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 此路径不需要没有任何意义，跳转到 tools
    void navigate({
      to: '/$teamId/tools',
    });
  }, []);

  return null;
};

export const Route = createFileRoute('/$teamId/comfyui/')({
  component: ComfyUI,
  beforeLoad: teamIdGuard,
});
