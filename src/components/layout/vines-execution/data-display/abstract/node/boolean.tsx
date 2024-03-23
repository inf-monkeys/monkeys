import React from 'react';

import { Check, X } from 'lucide-react';

import { JSONValue } from '@/components/ui/code-editor';

interface IVinesAbstractBooleanProps {
  children: JSONValue;
}
export const VinesAbstractBoolean: React.FC<IVinesAbstractBooleanProps> = ({ children }) => {
  return (
    <p className="rounded-md border border-input bg-background p-1.5 text-sm shadow-sm">
      {children ? (
        <Check className="stroke-green-10" size={16} strokeWidth={3} />
      ) : (
        <X className="stroke-red-10" size={16} strokeWidth={3} />
      )}
    </p>
  );
};
