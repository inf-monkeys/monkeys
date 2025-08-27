import { getI18nContent } from '@/utils';

import { VinesToolDef } from './typings';

interface ToolSearchIndex {
  tool: VinesToolDef;
  searchableText: string;
  category: string;
  keywords: string[];
}

export class ToolSearchService {
  private searchIndex: ToolSearchIndex[] = [];
  private categoryIndex: Map<string, ToolSearchIndex[]> = new Map();
  private searchCache: Map<string, VinesToolDef[]> = new Map();

  // 构建搜索索引
  public buildSearchIndex(tools: VinesToolDef[]) {
    this.searchIndex = tools.map((tool) => {
      const displayName = getI18nContent(tool.displayName) || '';
      const description = getI18nContent(tool.description) || '';
      const category = tool.categories?.[0] || 'unknown';

      // 构建可搜索文本
      const searchableText = [displayName, tool.name, description, tool.namespace || '']
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // 提取关键词
      const keywords = this.extractKeywords(searchableText);

      return {
        tool,
        searchableText,
        category,
        keywords,
      };
    });

    // 构建分类索引
    this.categoryIndex.clear();
    this.searchIndex.forEach((item) => {
      const categoryList = this.categoryIndex.get(item.category) || [];
      categoryList.push(item);
      this.categoryIndex.set(item.category, categoryList);
    });

    // 清除搜索缓存
    this.searchCache.clear();
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    return text.split(/\s+|[_-]/).filter((word) => word.length > 1);
  }

  // 计算搜索相关度得分
  private calculateRelevanceScore(item: ToolSearchIndex, searchTerms: string[]): number {
    let score = 0;
    const lowerSearchTerms = searchTerms.map((term) => term.toLowerCase());

    lowerSearchTerms.forEach((term) => {
      // 完全匹配工具名称 - 最高分
      if (item.tool.name.toLowerCase() === term) {
        score += 100;
      }
      // displayName 完全匹配
      else if (getI18nContent(item.tool.displayName)?.toLowerCase() === term) {
        score += 80;
      }
      // displayName 开始匹配
      else if (getI18nContent(item.tool.displayName)?.toLowerCase().startsWith(term)) {
        score += 60;
      }
      // 包含在 displayName 中
      else if (getI18nContent(item.tool.displayName)?.toLowerCase().includes(term)) {
        score += 40;
      }
      // 关键词匹配
      else if (item.keywords.some((keyword) => keyword.includes(term))) {
        score += 20;
      }
      // 在描述中匹配
      else if (item.searchableText.includes(term)) {
        score += 10;
      }
    });

    // 根据搜索词匹配数量调整分数
    const matchedTerms = lowerSearchTerms.filter((term) => item.searchableText.includes(term)).length;
    score *= matchedTerms / searchTerms.length;

    return score;
  }

  // 执行搜索
  public search(query: string, category?: string): VinesToolDef[] {
    if (!query.trim()) {
      const categoryTools = category && category !== 'all' ? this.categoryIndex.get(category) || [] : this.searchIndex;
      return categoryTools.map((item) => item.tool);
    }

    const cacheKey = `${query}_${category || 'all'}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const searchTerms = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0);

    const candidateItems = category && category !== 'all' ? this.categoryIndex.get(category) || [] : this.searchIndex;

    // 计算每个工具的相关度得分
    const scoredResults = candidateItems
      .map((item) => ({
        tool: item.tool,
        score: this.calculateRelevanceScore(item, searchTerms),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((result) => result.tool);

    // 缓存结果
    this.searchCache.set(cacheKey, scoredResults);

    // 限制缓存大小
    if (this.searchCache.size > 100) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }

    return scoredResults;
  }

  // 清除缓存
  public clearCache() {
    this.searchCache.clear();
  }

  // 获取搜索建议
  public getSuggestions(query: string, limit = 5): string[] {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    this.searchIndex.forEach((item) => {
      const displayName = getI18nContent(item.tool.displayName) || '';

      // 添加以查询开头的 displayName
      if (displayName.toLowerCase().startsWith(lowerQuery)) {
        suggestions.add(displayName);
      }

      // 添加包含查询的关键词
      item.keywords.forEach((keyword) => {
        if (keyword.startsWith(lowerQuery) && keyword.length > lowerQuery.length) {
          suggestions.add(keyword);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// 单例实例
export const toolSearchService = new ToolSearchService();
