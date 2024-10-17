import React, { useEffect } from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

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

export const Route = createLazyFileRoute('/$teamId/comfyui/')({
  component: ComfyUI,
});
