//ref: https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web/blob/main/app/components/chat.tsx#L206
import React, { useEffect, useRef } from 'react';

export enum SubmitKey {
  Enter = 'Enter',
  CtrlEnter = 'Ctrl + Enter',
  ShiftEnter = 'Shift + Enter',
  AltEnter = 'Alt + Enter',
  MetaEnter = 'Meta + Enter',
}

export interface UseSubmitHandlerProps {
  submitKey?: SubmitKey;
}

export function useSubmitHandler({ submitKey = SubmitKey.Enter }: UseSubmitHandlerProps = {}) {
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener('compositionstart', onCompositionStart);
    window.addEventListener('compositionend', onCompositionEnd);

    return () => {
      window.removeEventListener('compositionstart', onCompositionStart);
      window.removeEventListener('compositionend', onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix Chinese input method "Enter" on Safari
    if (e.keyCode == 229) return false;
    if (e.key !== 'Enter') return false;
    if (e.key === 'Enter' && (e.nativeEvent.isComposing || isComposing.current)) return false;
    return (
      (submitKey === SubmitKey.AltEnter && e.altKey) ||
      (submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (submitKey === SubmitKey.Enter && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}
