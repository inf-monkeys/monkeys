import React from 'react';

import { Eye } from 'lucide-react';
import Image from 'rc-image';

import { JSONValue } from '@/components/ui/code-editor';

interface IVinesAbstractImageProps {
  children: JSONValue;
}

export const VinesAbstractImage: React.FC<IVinesAbstractImageProps> = ({ children }) => {
  return (
    <Image
      src={children?.toString()}
      alt="image"
      className="max-w-96 rounded-md border border-input bg-background object-cover shadow-md"
      loading="lazy"
      preview={{
        mask: <Eye className="stroke-white" />,
      }}
    />
  );
};
