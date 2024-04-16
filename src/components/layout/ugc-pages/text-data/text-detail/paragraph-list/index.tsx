import React, { useEffect, useState } from 'react';

import { ArrowDownUp, Tag, Waypoints } from 'lucide-react';
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
  const { data: detail } = useKnowledgeBase(textId);
  const { data: fields } = useKnowledgeBaseMetadataFields(textId);

  const [from, setFrom] = useState(0);
  const [searchMode, setSearchMode] = useState<string>('fulltext');

  const [inputData, setInputData] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [metadataFilter, setMetadataFilter] = useState<IFullTextSearchParams['metadataFilter']>();

  const { data, isLoading, mutate } = useSearchKnowledgeBase(
    textId,
    { from, query, metadataFilter },
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
            <SelectValue placeholder="搜索模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fulltext">全文搜索</SelectItem>
            <SelectItem value="vector">向量搜索</SelectItem>
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
          metadata={fields ?? []}
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
                {searchMode === 'fulltext' ? (
                  <Button
                    variant="outline"
                    size="small"
                    loading={isLoading}
                    onClick={() => setFrom((prev) => prev + 30)}
                  >
                    加载更多
                  </Button>
                ) : (
                  <Button variant="outline" size="small">
                    向量检索只显示前 10 条
                  </Button>
                )}
              </td>
            </tr>
          </tfoot>
        }
      />
      <div className="mt-2 flex w-full items-center gap-4">
        <div className="flex items-center gap-2">
          <Waypoints className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">向量维度：{detail?.dimension ?? '-'}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <ArrowDownUp className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">Embedding 模型：{detail?.embeddingModel ?? '-'}</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Tag className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">知识库 ID：{detail?.name ?? '-'}</span>
        </div>
      </div>
    </>
  );
};
