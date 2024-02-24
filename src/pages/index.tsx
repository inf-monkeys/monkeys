import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Sidebar } from '@/components/layout/main/sidebar';
import { authGuard } from '@/components/router/auth-guard';

const App: React.FC = () => {
  return (
    <div className="flex w-screen bg-slateA-3">
      <Sidebar />
      <div className="flex flex-1">
        <div className="m-4 ml-0 w-full rounded-xl bg-white p-4">
          <h1 className="font-bold text-vines-500">Hello World!</h1>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: App,
  beforeLoad: authGuard,
});
