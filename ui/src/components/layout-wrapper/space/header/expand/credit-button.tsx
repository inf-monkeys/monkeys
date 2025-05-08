import { Link } from '@tanstack/react-router';

import { StarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const CreditButton: React.FC = () => {
  return (
    <Link to={'/$teamId/settings?tab=team-credit' as any}>
      <Button icon={<StarIcon />} variant="outline" size="small" className="flex items-center gap-1">
        0
      </Button>
    </Link>
  );
};
