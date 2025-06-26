import { create } from 'zustand';

interface ReportState {
  open: boolean;
  content: string;
  setOpen: (open: boolean) => void;
  setContent: (content: string) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  open: false,
  content: '',
  setOpen: (open) => set({ open }),
  setContent: (content) => set({ content }),
}));
