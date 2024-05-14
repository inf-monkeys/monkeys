import React, { useEffect, useRef, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { JSONValue } from '@/components/ui/code-editor';
import { useAppStore } from '@/store/useAppStore';
import useExternal from '@/utils/useExternal.ts';

interface IVinesAbstractPDBProps {
  children: JSONValue;
}

export const VinesAbstractPDB: React.FC<IVinesAbstractPDBProps> = ({ children }) => {
  const { darkMode } = useAppStore();

  const node = useRef<HTMLDivElement>(null);

  const molstarCss = useExternal('/pdbe/molstar.css');
  const molstarPlugin = useExternal('/pdbe/molstar-plugin.js');

  const [molstarInstance, setMolstarInstance] = useState<any>(null);
  const isLoading = !(molstarCss === 'ready' && molstarPlugin === 'ready');

  useEffect(() => {
    if (!isLoading && node.current) {
      const options = {
        customData: {
          url: String(children),
          format: 'pdb',
          binary: false,
        },
        hideControls: true,
      };

      try {
        // @ts-ignore
        const viewerInstance = new PDBeMolstarPlugin();
        if ('render' in viewerInstance) {
          viewerInstance.render(node.current, options);
          viewerInstance?.events?.loadComplete?.subscribe(() => {
            setMolstarInstance(viewerInstance);
            viewerInstance?.visual?.toggleSpin(true);
          });
        } else {
          toast.error('Molstar Plugin 加载失败！');
        }
      } catch (e) {
        console.error('[vines-molstar-pdbe]:', e);
        toast.error('Molstar Plugin 发生错误！');
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (molstarInstance) {
      try {
        molstarInstance?.canvas?.setBgColor(darkMode ? { r: 17, g: 17, b: 19 } : { r: 252, g: 252, b: 253 });
      } catch (e) {
        console.error('[vines-molstar-pdbe]:', e);
        toast.error('Molstar Plugin 发生错误！');
      }
    }
  }, [molstarInstance, darkMode]);

  return (
    <div className="relative m-2 max-h-full min-h-96 w-[calc(100%-1rem)] overflow-hidden rounded-md border border-input shadow">
      <AnimatePresence>
        {isLoading && !molstarInstance && (
          <motion.div
            key="vines-molstar-loader"
            className="vines-center absolute left-0 top-0 size-full flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
            <div className="space-y-1">
              <p className="text-xxs opacity-70">Molstar CSS: {molstarCss}</p>
              <p className="text-xxs opacity-70">Molstar Plugin: {molstarPlugin}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key="vines-molstar"
        ref={node}
        className="overflow-hidden rounded-lg"
        animate={{ opacity: molstarInstance ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onTap={() => molstarInstance?.visual?.toggleSpin(false)}
      />
    </div>
  );
};
