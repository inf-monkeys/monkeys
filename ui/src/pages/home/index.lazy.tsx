import React, { useMemo } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useSystemConfig } from '@/apis/common';
import { ArtistLandingPage } from '@/components/landing/artist';
import { BSDLandingPage } from '@/components/landing/bsd';
import { ConceptDesignLandingPage } from '@/components/landing/concept-design';
import { DefaultLandingPage } from '@/components/landing/default';
import { VinesLoading } from '@/components/ui/loading';

export const HomePage: React.FC = () => {
  const { data: oem, isLoading } = useSystemConfig();

  const Page = useMemo(() => {
    switch (oem?.theme.id) {
      case 'concept-design':
        return ConceptDesignLandingPage;
      case 'artist':
        return ArtistLandingPage;
      case 'bsd':
        return BSDLandingPage;

      case 'default':
      default:
        return DefaultLandingPage;
    }
  }, [oem?.theme.id]);

  return isLoading ? <VinesLoading /> : <Page />;
};

export const Route = createLazyFileRoute('/home/')({
  component: HomePage,
});
