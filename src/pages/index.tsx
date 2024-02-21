import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

const App: React.FC = () => {
  return <h1 className="font-bold text-vines-500">Hello World!</h1>;
};
export const Route = createFileRoute('/')({
  component: App,
});
