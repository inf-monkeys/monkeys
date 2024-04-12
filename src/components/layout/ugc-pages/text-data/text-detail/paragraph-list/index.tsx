import React, { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useTextSearch, useVectorCollection } from '@/apis/vector';
import { IFullTextSearchParams, IVectorRecord } from '@/apis/vector/typings.ts';
import { columns } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list/consts.tsx';
import { MetadataFilter } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list/metadata-filter.tsx';
import { Button } from '@/components/ui/button';
import { InfiniteScrollingDataTable } from '@/components/ui/data-table/infinite.tsx';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { cn } from '@/utils';

interface IParagraphListProps {
  textId: string;
}

export const ParagraphList: React.FC<IParagraphListProps> = ({ textId }) => {
  const { data: detail } = useVectorCollection(textId);

  const [from, setFrom] = useState(30);
  const [searchMode, setSearchMode] = useState<string>('vector');

  const [inputData, setInputData] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [metadataFilter, setMetadataFilter] = useState<IFullTextSearchParams['metadataFilter']>();

  const { data, isLoading, mutate } = useTextSearch(textId, { from, query, metadataFilter }, searchMode === 'vector');

  const [hits, setHits] = useState<IVectorRecord[]>([]);

  const [forceClearHits, setForceClearHits] = useState(false);
  useEffect(() => {
    const fetchHits = data?.hits;
    if (fetchHits) {
      if (forceClearHits || fetchHits?.[0]?._id !== hits?.[0]?._id) {
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
            <SelectValue placeholder="搜索模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vector">向量搜索</SelectItem>
            <SelectItem value="fulltext">全文搜索</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex flex-1 items-center">
          <Input
            placeholder="输入文本进行相似度排序，回车搜索"
            value={inputData}
            onChange={setInputData}
            onEnterPress={() => {
              setForceClearHits(true);
              setQuery(inputData);
              toast.info('已搜索');
            }}
          />
          <Button
            className={cn('absolute right-2 -mx-2 scale-80', isQueryEmpty && '-mx-3')}
            variant="outline"
            onClick={() => {
              if (isQueryEmpty) {
                setForceClearHits(true);
                void mutate();
                toast.info('已重新排序搜索');
              } else {
                setForceClearHits(false);
                setHits([]);
                setInputData('');
                setQuery('');
              }
            }}
            loading={isLoading}
          >
            {isQueryEmpty ? '重新排序搜索' : '清空'}
          </Button>
        </div>
        <MetadataFilter
          metadata={detail?.metadataFields ?? []}
          onFilter={(filter) => {
            setMetadataFilter(filter);
            setForceClearHits(true);
          }}
        />
      </div>
      <InfiniteScrollingDataTable
        className="h-3/5"
        columns={columns}
        data={hits}
        loading={isLoading}
        tfoot={
          <tfoot className="relative">
            <tr>
              <td className="absolute w-full py-4 text-center">
                <Button variant="outline" size="small" loading={isLoading} onClick={() => setFrom((prev) => prev + 30)}>
                  加载更多
                </Button>
              </td>
            </tr>
          </tfoot>
        }
      />
    </>
  );
};
