import z from 'zod';

export enum KnowledgeBaseRetrievalMode {
  VectorSearch = 'vector-search',
  FullTextSearch = 'fulltext-search',
}

export const retrievalSettingsSchema = z.object({
  mode: z.enum(['vector-search', 'fulltext-search']),
  topK: z.number().max(10, '最大为 10').min(1, '最小为 1'),
  enabledMetadataFilter: z.boolean().optional(),
  metadataFilterKey: z.string().optional(),
});

export type IRetrievalSettings = z.infer<typeof retrievalSettingsSchema>;
