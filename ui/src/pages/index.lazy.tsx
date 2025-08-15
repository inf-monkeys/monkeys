import React from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { DefaultLandingPage } from '@/components/landing/default';
import { isAuthed } from '@/components/router/guard/auth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  if (!isAuthed()) {
    navigate({
      to: '/home',
    });
    return null;
  }

  return <DefaultLandingPage />;
};

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});
