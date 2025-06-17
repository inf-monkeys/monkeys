import React, { createContext, useCallback, useEffect } from 'react';

import { useReportStore } from '.';

export interface ReportProviderProps {
  children: React.ReactNode;
  onReport?: () => string | Promise<string>;
}

interface ReportContextValue {
  setReportContent: (content: string) => void;
}

export const ReportContext = createContext<ReportContextValue | null>(null);

export interface ReportProviderProps {
  children: React.ReactNode;
  onReport?: () => string | Promise<string>;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children, onReport }) => {
  const setContent = useReportStore((state) => state.setContent);
  const setOpen = useReportStore((state) => state.setOpen);

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (onReport) {
          const newContent = await onReport();
          setContent(newContent);
          setOpen(true);
        }
      }
    },
    [onReport],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return <ReportContext.Provider value={{ setReportContent: setContent }}>{children}</ReportContext.Provider>;
};
