import React from 'react';

import { JSONValue } from '@/components/ui/code-editor';

interface IVinesAbstractImageProps {
  children: JSONValue;
}

export const VinesAbstractImage: React.FC<IVinesAbstractImageProps> = ({ children }) => {
  return (
    <img
      src={children?.toString()}
      alt="image"
      className="max-w-96 rounded-md border border-input bg-background object-cover shadow-md"
    />
  );
};
