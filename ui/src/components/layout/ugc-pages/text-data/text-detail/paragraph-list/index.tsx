import React, { useEffect, useState } from 'react';

import { ArrowDownUp, Tag, Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useKnowledgeBase, useKnowledgeBaseMetadataFields, useSearchKnowledgeBase } from '@/apis/vector';
import { IFullTextSearchParams, IVectorRecord } from '@/apis/vector/typings.ts';
import { columns } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list/consts.tsx';
import { MetadataFilter } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list/metadata-filter.tsx';
import { Button } from '@/components/ui/button';
import { InfiniteScrollingDataTable } from '@/components/ui/data-table/infinite.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { cn } from '@/utils';

interface IParagraphListProps {
  textId: string;
}

export const ParagraphList: React.FC<IParagraphListProps> = ({ textId }) => {
  const { t } = useTranslation();

  const { data: detail } = useKnowledgeBase(textId);
  const { data: fields } = useKnowledgeBaseMetadataFields(textId);

  const [from, setFrom] = useState(0);
  const [searchMode, setSearchMode] = useState<string>('fulltext');

  const [inputData, setInputData] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [metadata_filter, setMetadataFilter] = useState<IFullTextSearchParams['metadata_filter']>();

  const size = 30;

  const { data, isLoading, mutate } = useSearchKnowledgeBase(
    textId,
    { from, query, metadata_filter, size },
    searchMode === 'vector',
  );

  const [hits, setHits] = useState<IVectorRecord[]>([]);

  const [forceClearHits, setForceClearHits] = useState(false);
  useEffect(() => {
    const fetchHits = data?.hits;
    if (fetchHits) {
      if (forceClearHits || fetchHits?.[0]?.pk !== hits?.[0]?.pk) {
        setHits(fetchHits);
        setForceClearHits(false);
      } else {
        setHits((prev) => [...prev, ...fetchHits]);
      }
    }
  }, [data?.hits]);

  const isQueryEmpty = !query.length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Select
          value={searchMode}
          onValueChange={(val) => {
            setSearchMode(val);
            setHits([]);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('ugc-page.text-data.detail.tabs.segments.search.mode.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fulltext">
              {t('ugc-page.text-data.detail.tabs.segments.search.mode.options.fulltext')}
            </SelectItem>
            <SelectItem value="vector">
              {t('ugc-page.text-data.detail.tabs.segments.search.mode.options.vector')}
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex flex-1 items-center">
          <Input
            placeholder={t('ugc-page.text-data.detail.tabs.segments.search.value.placeholder')}
            value={inputData}
            onChange={setInputData}
            onEnterPress={() => {
              setForceClearHits(true);
              setQuery(inputData);
              toast.info(t('ugc-page.text-data.detail.tabs.segments.toast.searched'));
            }}
          />
          <Button
            className={cn('scale-80 absolute right-2 -mx-2', isQueryEmpty && '-mx-3')}
            variant="outline"
            onClick={() => {
              if (isQueryEmpty) {
                setForceClearHits(true);
                void mutate();
                toast.info(t('ugc-page.text-data.detail.tabs.segments.toast.searched-after-re-sorting'));
              } else {
                setForceClearHits(false);
                setHits([]);
                setInputData('');
                setQuery('');
              }
            }}
            loading={isLoading}
          >
            {isQueryEmpty
              ? t('ugc-page.text-data.detail.tabs.segments.search.value.sort-button.re-sort')
              : t('ugc-page.text-data.detail.tabs.segments.search.value.sort-button.clear')}
          </Button>
        </div>
        <MetadataFilter
          metadata={fields ?? []}
          onFilter={(filter) => {
            setMetadataFilter(filter);
            setForceClearHits(true);
          }}
        />
      </div>
      <InfiniteScrollingDataTable
        className="h-[calc(100vh-14rem)]"
        columns={columns}
        data={hits}
        loading={isLoading}
        tfoot={
          <tfoot className="relative">
            <tr>
              <td className="absolute w-full py-4 text-center">
                {searchMode === 'fulltext' ? (
                  hits.length < size ? (
                    <span>{t('common.utils.all-loaded')}</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="small"
                      loading={isLoading}
                      onClick={() => setFrom((prev) => prev + 30)}
                    >
                      {t('common.utils.load-more')}
                    </Button>
                  )
                ) : (
                  <span>{t('ugc-page.text-data.detail.tabs.segments.load-tip')}</span>
                )}
              </td>
            </tr>
          </tfoot>
        }
      />
      <div className="mt-2 flex w-full items-center gap-4">
        <div className="flex items-center gap-2">
          <Waypoints className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">
            {t('ugc-page.text-data.detail.tabs.segments.stats.dimension', {
              dimensionCount: detail?.dimension ?? '-',
            })}
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <ArrowDownUp className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">
            {t('ugc-page.text-data.detail.tabs.segments.stats.model', {
              model: detail?.embeddingModel ?? '-',
            })}
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Tag className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">
            {t('ugc-page.text-data.detail.tabs.segments.stats.id', {
              id: detail?.uuid ?? '-',
            })}
          </span>
        </div>
      </div>
    </>
  );
};
