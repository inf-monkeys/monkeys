import { Link } from '@tanstack/react-router';

import { StarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const QuotaButton: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Link to={'/$teamId/settings?tab=team-quota' as any}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<StarIcon />} variant="outline" size="small" className="flex items-center gap-1">
            1000
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span className="text-foreground">{t('settings.team-quota.title')}</span>
        </TooltipContent>
      </Tooltip>
    </Link>
  );
};
