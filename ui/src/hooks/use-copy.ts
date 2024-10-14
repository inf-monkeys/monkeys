// ref: https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-clipboard/use-clipboard.ts
import { useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { toast } from 'sonner';

import i18n from '@/i18n.ts';

export const useCopy = ({ timeout = 2000 } = {}) => {
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyTimeout, setCopyTimeout] = useState<number | null>(null);

  const handleCopyResult = useMemoizedFn((value: boolean) => {
    window.clearTimeout(copyTimeout!);
    setCopyTimeout(window.setTimeout(() => setCopied(false), timeout));
    setCopied(value);
    if (value) {
      toast.success(i18n.t('common.toast.copy-success'));
    } else {
      toast.error(i18n.t('common.toast.copy-failed'));
    }
  });

  const copy = useMemoizedFn((valueToCopy: any) => {
    console.log('[VinesCopy]:', valueToCopy);
    try {
      if ('clipboard' in navigator) {
        navigator.clipboard.writeText(valueToCopy).then(() => handleCopyResult(true));
      } else {
        new Error('useCopy: navigator.clipboard is not supported');
      }
    } catch (e) {
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = valueToCopy;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      tempTextArea.setSelectionRange(0, 99999); // 对于移动设备

      try {
        document.execCommand('copy');
        handleCopyResult(true);
      } catch {
        setError(e as Error | null);
        handleCopyResult(false);
      } finally {
        document.body.removeChild(tempTextArea);
      }
    }
  });

  const reset = useMemoizedFn(() => {
    setCopied(false);
    setError(null);
    window.clearTimeout(copyTimeout!);
  });

  return { copy, reset, error, copied };
};
