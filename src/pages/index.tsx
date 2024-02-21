import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

const App: React.FC = () => {
  return (
    <div className={'flex flex-col gap-8'}>
      <h1 className="font-bold text-vines-500">Hello World!</h1>
    </div>
  );
};

export const Route = createFileRoute('/')({
  component: App,
});
