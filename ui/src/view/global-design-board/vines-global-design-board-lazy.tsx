import React from 'react';

import { PencilOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useDesignBoardStore } from '@/store/useDesignBoardStore';

import DesignBoardView from '../design-board/vines-design-board-lazy';

const GloablDesignBoardView: React.FC = () => {
  const { t } = useTranslation();

  const { designBoardId } = useDesignBoardStore();

  return designBoardId ? (
    <DesignBoardView embed />
  ) : (
    <main className="vines-center size-full flex-col">
      <PencilOff size={64} />
      <div className="mt-4 flex flex-col text-center">
        <h2 className="font-bold">{t('workspace.global-design-board.empty')}</h2>
      </div>
    </main>
  );
};

export default GloablDesignBoardView;
