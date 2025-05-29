import React, { useEffect } from 'react';

import { useDesignBoardStore } from '@/store/useDesignBoardStore';

interface IVinesDesignBoardViewWrapperProps {
  children?: React.ReactNode;
  designBoardId?: string;
}

export const VinesDesignBoardViewWrapper: React.FC<IVinesDesignBoardViewWrapperProps> = ({
  children,
  designBoardId,
}) => {
  const setDesignBoardId = useDesignBoardStore((s) => s.setDesignBoardId);

  useEffect(() => {
    if (designBoardId) {
      setDesignBoardId(designBoardId);
    }
  }, [designBoardId]);

  return children;
};
