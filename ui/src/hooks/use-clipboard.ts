// ref: https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-clipboard/use-clipboard.ts
import { useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { toast } from 'sonner';

import i18n from '@/i18n.ts';

export const useClipboard = ({ showSuccess = true } = {}) => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);

  const handleReadResult = useMemoizedFn((value: string | null, success: boolean) => {
    setData(value);
    setLoading(false);
    if (success) {
      if (showSuccess) {
        toast.success(i18n.t('common.toast.paste-success'));
      }
    } else {
      toast.error(i18n.t('common.toast.paste-failed'));
    }
  });

  const read = useMemoizedFn(async () => {
    console.log('[VinesClipboard]: Reading from clipboard');
    setLoading(true);
    try {
      if ('clipboard' in navigator) {
        const text = await navigator.clipboard.readText();
        handleReadResult(text, true);
        return text;
      } else {
        throw new Error('useClipboard: navigator.clipboard is not supported');
      }
    } catch (e) {
      setError(e as Error | null);
      handleReadResult(null, false);
      return null;
    }
  });

  const reset = useMemoizedFn(() => {
    setData(null);
    setError(null);
    setLoading(false);
  });

  return { read, reset, error, data, loading };
};
