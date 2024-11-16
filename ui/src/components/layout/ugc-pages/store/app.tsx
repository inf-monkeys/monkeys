import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { DeleteApp } from '@/components/layout/ugc-pages/store/delete.tsx';
import { OneClickToUseApp } from '@/components/layout/ugc-pages/store/one-click-to-use-app.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { VinesImage } from '@/components/ui/image';
import VinesMarkdown from '@/components/ui/markdown/markdown-lazy.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

interface IStoreAppProps extends IApplicationStoreItemDetail {
  mutate: () => void;
}

export const StoreApp: React.FC<IStoreAppProps> = (props) => {
  const { id, iconUrl, thumbnail, displayName, description, teamId: itTeamId, mutate, assetTags } = props;
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const isEmojiIcon = iconUrl.startsWith('emoji:');
  const isThumbnailValid = thumbnail?.startsWith('http');
  const title = getI18nContent(displayName);
  const desc = getI18nContent(description);

  const [hover, setHover] = useState(false);

  return (
    <motion.div
      key={id}
      className="relative m-2 h-48 w-[calc(100%-1rem)] overflow-hidden rounded-md border border-input shadow-sm"
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      <div className="m-3 mb-0 h-3/4 overflow-hidden rounded-t-md">
        {isThumbnailValid && thumbnail ? (
          <VinesImage src={thumbnail} alt={title} className="w-full object-cover" disabled />
        ) : isEmojiIcon ? (
          <VinesIcon src={iconUrl} className="[&_img]:!size-12" />
        ) : (
          <VinesImage src={iconUrl} alt={title} className="w-full object-cover" disabled />
        )}
      </div>
      <motion.div
        className="absolute bottom-0 w-full overflow-hidden"
        variants={{
          visible: { marginBottom: 0 },
          hidden: { marginBottom: desc ? -92 : -55 },
        }}
        initial="hidden"
        animate={hover ? 'visible' : 'hidden'}
      >
        <div className="flex w-full items-center gap-1 px-2 pb-1">
          {assetTags.map((it, i) => (
            <div className="rounded bg-slate-1/45 px-2 py-1 text-sm backdrop-blur-md" key={i}>
              {it.name}
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-b-md bg-slate-1/35 p-4 backdrop-blur-md">
          <h1 className="text-base font-bold">{title}</h1>
          {desc && (
            <ScrollArea disabledOverflowMask className="-my-2 h-8">
              <VinesMarkdown className="min-h-[55px] flex-1 text-sm">{desc}</VinesMarkdown>
            </ScrollArea>
          )}
          <div className="flex h-10 w-full items-center gap-2">
            <OneClickToUseApp {...props}>
              <Button className="w-full" variant="outline">
                {t('components.layout.ugc.import-dialog.import-to-team.label')}
              </Button>
            </OneClickToUseApp>

            {teamId === itTeamId && <DeleteApp id={id} mutate={mutate} />}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
