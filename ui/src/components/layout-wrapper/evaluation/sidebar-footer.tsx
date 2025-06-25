import React from 'react';

import { useParams } from '@tanstack/react-router';
import { ExternalLink, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCopy } from '@/hooks/use-copy.ts';

export const EvaluationSidebarFooter: React.FC = () => {
  const { t } = useTranslation();
  const { copy } = useCopy();
  const { teamId, moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  const handleShare = () => {
    const url = `${window.location.origin}/${teamId}/evaluations/${moduleId}/leaderboard`;
    copy(url);
  };

  const handleOpenInNewTab = () => {
    const url = `/${teamId}/evaluations/${moduleId}/leaderboard`;
    window.open(url, '_blank');
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-8 gap-1.5 text-xs"
        >
          <Share2 className="h-3 w-3" />
          {t('common.utils.share')}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenInNewTab}
          className="h-8 gap-1.5 text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          {t('common.utils.open')}
        </Button>
      </div>
    </div>
  );
};