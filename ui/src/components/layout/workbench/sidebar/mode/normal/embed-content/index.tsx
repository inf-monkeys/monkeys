import { I18nValue } from '@inf-monkeys/monkeys';

import { useSystemConfig } from '@/apis/common';
import { ViewTitle } from '@/components/layout/workspace/vines-view/form/tabular/view-title';
import { getI18nContent } from '@/utils';

interface IWorkbenchSidebarNormalModeEmbedContentProps {
  displayName?: string | I18nValue;
  children: React.ReactNode;
}

export const WorkbenchSidebarNormalModeEmbedContent: React.FC<IWorkbenchSidebarNormalModeEmbedContentProps> = ({
  displayName,
  children,
}) => {
  const { data: oem } = useSystemConfig();

  return (
    <div className="relative w-[320px]">
      <ViewTitle displayName={getI18nContent(displayName)} themeGradient={Boolean(oem?.theme.gradient)} />
      <div className="mt-[42px] h-[calc(100%-42px)]">{children}</div>
    </div>
  );
};
