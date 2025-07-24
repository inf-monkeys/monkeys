import React, { createContext, useContext, useState } from 'react';

import { UniImagePreviewDialog } from './dialog';

interface UniImagePreviewContextType {
  open: boolean;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  openPreview: (url: string) => void;
  closePreview: () => void;
}

const UniImagePreviewContext = createContext<UniImagePreviewContextType>({
  open: false,
  imageUrl: null,
  setImageUrl: () => {},
  openPreview: () => {},
  closePreview: () => {},
});

export const useUniImagePreview = () => {
  const context = useContext(UniImagePreviewContext);
  if (!context) {
    throw new Error('useUniImagePreview must be used within an UniImagePreviewProvider');
  }
  return context;
};

export const UniImagePreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const openPreview = (url: string) => {
    setImageUrl(url);
    setOpen(true);
  };

  const closePreview = () => {
    setOpen(false);
    setImageUrl(null);
  };

  return (
    <UniImagePreviewContext.Provider
      value={{
        open,
        imageUrl,
        setImageUrl,
        openPreview,
        closePreview,
      }}
    >
      {children}
      <UniImagePreviewDialog />
    </UniImagePreviewContext.Provider>
  );
};
