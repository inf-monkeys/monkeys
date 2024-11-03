import { useCallback, useEffect, useMemo, useState } from 'react';

import { State, Uppy, UppyEventMap } from '@uppy/core';
import getFileNameAndExtension from '@uppy/utils/lib/getFileNameAndExtension';
import toArray from '@uppy/utils/lib/toArray';
import type { Body, Meta } from '@uppy/utils/lib/UppyFile';
import { useMemoizedFn } from 'ahooks';
import { DropEvent, ErrorCode, FileError, FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js';

import { IVinesUploaderProps } from '@/components/ui/vines-uploader/index.tsx';

import { addProtocolToURL, checkIfCorrectURL, getFileNameByOssUrl } from './utils';

interface IVinesDropzoneOptions {
  onPasteOrDropCallback?: (file: File) => void;
}

export const useVinesDropzone = ({
  accept = [],
  onPasteOrDropCallback,
}: IVinesUploaderProps & IVinesDropzoneOptions) => {
  const { t } = useTranslation();

  const onDropRejected = useMemoizedFn((fileRejections: FileRejection[], _event: DropEvent): void => {
    fileRejections.forEach(({ errors, file: { name: filename } }) => {
      errors.forEach(({ code }) => {
        if (
          [
            ErrorCode.FileTooLarge,
            ErrorCode.FileTooSmall,
            ErrorCode.TooManyFiles,
            ErrorCode.FileInvalidType,
            'filename-invalid',
          ].includes(code)
        ) {
          toast.error(
            t(`components.ui.updater.toast.${code}`, {
              filename,
            }),
          );
        } else {
          toast.error(
            t(`components.ui.updater.toast.file-invalid-type`, {
              filename,
            }),
          );
        }
      });
    });
  });

  const validator = useMemoizedFn(<T extends File>(file: T): FileError | FileError[] | null => {
    const { name, extension } = getFileNameAndExtension(file?.name ?? '');

    if (/[!@#$%^&*.]{2,}/.test(name)) {
      return {
        code: 'filename-invalid',
        message: '',
      };
    }

    if (accept?.length) {
      if (!accept?.includes(extension ?? '')) {
        return {
          code: 'file-invalid-type',
          message: '',
        };
      }
    }

    return null;
  });

  const onPaste = useMemoizedFn((event: ClipboardEvent) => {
    if (!onPasteOrDropCallback) return;

    const items = toArray(event.clipboardData!.items);

    const atLeastOneFileIsDragged = items.some((item) => item.kind === 'file');
    if (atLeastOneFileIsDragged) {
      items
        .filter((it) => it.kind === 'file' && it.type.indexOf('image') !== -1)
        .map((it) => {
          const file = it.getAsFile();
          if (file) {
            onPasteOrDropCallback(file);
          }
        });
      return;
    }

    items
      .filter((item) => item.kind === 'string' && item.type === 'text/plain')
      .forEach((item) =>
        item.getAsString((protocolsUrl) => {
          const url = addProtocolToURL(protocolsUrl);
          if (checkIfCorrectURL(url)) {
            const file = new File([], getFileNameByOssUrl(url), { type: 'text/plain' }) as File & {
              meta?: { remoteUrl: string };
            };
            file.meta = { remoteUrl: url };
            onPasteOrDropCallback(file);
          }
        }),
      );
  });

  const onDrag = useMemoizedFn((event: DragEvent) => {
    if (!onPasteOrDropCallback) return;

    toArray(event.dataTransfer!.items)
      .filter((item) => item.kind === 'string' && item.type === 'text/uri-list')
      .forEach((item) =>
        item.getAsString((protocollessUrl) => {
          const url = addProtocolToURL(protocollessUrl);
          if (checkIfCorrectURL(url)) {
            const file = new File([], getFileNameByOssUrl(url), { type: 'text/plain' }) as File & {
              meta?: { remoteUrl: string };
            };
            file.meta = { remoteUrl: url };
            onPasteOrDropCallback(file);
          }
        }),
      );
  });

  return {
    onDropRejected,
    validator,
    onPaste,
    onDrag,
  };
};

// Uppy/react
export function useUppyState<M extends Meta = Meta, B extends Body = Body, T = any>(
  uppy: Uppy<M, B>,
  selector: (state: State<M, B>) => T,
): T {
  const subscribe = useMemo(() => uppy.store.subscribe.bind(uppy.store), [uppy.store]);
  const getSnapshot = useCallback(() => uppy.store.getState(), [uppy.store]);

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, null, selector);
}

type EventResults<M extends Meta, B extends Body, K extends keyof UppyEventMap<M, B>> = Parameters<
  UppyEventMap<M, B>[K]
>;

export function useUppyEvent<M extends Meta, B extends Body, K extends keyof UppyEventMap<M, B>>(
  uppy: Uppy<M, B>,
  event: K,
  callback?: (...args: EventResults<M, B, K>) => void,
): [EventResults<M, B, K> | [], () => void] {
  const [result, setResult] = useState<EventResults<M, B, K> | []>([]);
  const clear = () => setResult([]);

  useEffect(() => {
    const handler = ((...args: EventResults<M, B, K>) => {
      setResult(args);
      callback?.(...args);
    }) as UppyEventMap<M, B>[K];

    uppy.on(event, handler);

    return function cleanup() {
      uppy.off(event, handler);
    };
  }, [uppy, event, callback]);

  return [result, clear];
}
