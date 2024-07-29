import React, { useLayoutEffect, useRef } from 'react';

import { useMemoizedFn } from 'ahooks';
import { mapValues } from 'lodash';
import { parse } from 'zipson';

import { useAppStore } from '@/store/useAppStore';
import { VinesLucideIconMetadata, VinesLucideIconSVG } from '@/store/useAppStore/icons.slice.ts';
import VinesEvent from '@/utils/events.ts';

interface IIconGuardProps {}

export const IconGuard: React.FC<IIconGuardProps> = () => {
  const setIcons = useAppStore((s) => s.setIcons);

  const triggerRef = useRef(false);
  const retryCountRef = useRef(0);
  const handle = useMemoizedFn(() => {
    if (!triggerRef.current) {
      triggerRef.current = true;

      const fetchData = async () => {
        try {
          const response = await fetch('/icons.zipson');
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const result = parse(await response.text()) as Record<
            string,
            { svg: VinesLucideIconSVG; metadata: VinesLucideIconMetadata }
          >;

          const svg = mapValues(result, (value) => value.svg);
          const metadata = mapValues(result, (value) => value.metadata);
          setIcons(svg, metadata);

          retryCountRef.current = 0;
        } catch (error) {
          if (retryCountRef.current > 5) {
            triggerRef.current = false;
          } else {
            retryCountRef.current += 1;

            const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
            setTimeout(fetchData, delay);
          }
        }
      };

      setTimeout(() => void fetchData());
    }
  });

  useLayoutEffect(() => {
    VinesEvent.on('vines-trigger-init-icons', handle);
    return () => {
      VinesEvent.off('vines-trigger-init-icons', handle);
    };
  }, []);

  return null;
};
