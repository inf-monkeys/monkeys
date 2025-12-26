import { BadRequestException, Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { MonkeyDataClient } from './monkey-data.client';

type MonkeyAsset = {
  id: string;
  team_id: string;
  creator_user_id?: string;
  name: string;
  asset_type: string;
  primary_content: any;
  properties?: Record<string, any>;
  files?: any[];
  media?: string;
  thumbnail?: string;
  keywords?: string;
  status?: string;
  extra?: Record<string, any>;
  tag_ids?: string[];
  created_timestamp: number;
  updated_timestamp: number;
};

type MonkeyView = {
  id: string;
  team_id?: string;
  name: string;
  description?: string;
  icon_url?: string;
  parent_id?: string;
  path: string;
  level: number;
  sort: number;
  display_config?: Record<string, any>;
  created_timestamp: number;
  updated_timestamp: number;
};

type MonkeyTag = {
  id: string;
  name: string;
  name_norm?: string;
  color?: string;
  extra?: Record<string, any>;
  created_timestamp: number;
  updated_timestamp: number;
};

type DataListResult = {
  list: any[];
  total: number;
  page: number;
  pageSize: number;
  nextPageToken?: string;
};

type DataNextPageResult = {
  list: any[];
  hasMore: boolean;
  pageSize: number;
  nextPageToken?: string;
};

@Injectable()
export class DataManagementV2Service {
  constructor(private readonly client: MonkeyDataClient) {}

  private requireTeamId(teamId?: string): string {
    const normalized = (teamId || '').trim();
    if (!normalized) {
      throw new BadRequestException('teamId required');
    }
    return normalized;
  }

  private normalizeLimit(value?: number): number {
    if (!value || Number.isNaN(Number(value))) return 20;
    const limit = Math.max(1, Number(value));
    return Math.min(200, limit);
  }

  private parseTags(raw?: string): string[] {
    if (!raw) return [];
    return raw
      .split(/[,;\s]+/g)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private applyExtraField(extra: Record<string, any>, key: string, value?: string) {
    if (value === undefined) return;
    const trimmed = value.trim();
    if (!trimmed) {
      delete extra[key];
      return;
    }
    extra[key] = trimmed;
  }

  private buildExtra(base: Record<string, any> | undefined, displayName?: string, description?: string) {
    const extra = { ...(base || {}) };
    this.applyExtraField(extra, 'display_name', displayName);
    this.applyExtraField(extra, 'description', description);
    return Object.keys(extra).length > 0 ? extra : undefined;
  }

  private mapAsset(asset: MonkeyAsset) {
    const extra = asset.extra || {};
    const displayName = typeof extra.display_name === 'string' && extra.display_name.trim()
      ? extra.display_name
      : asset.name;
    const description = typeof extra.description === 'string' ? extra.description : undefined;

    return {
      id: asset.id,
      pinOrder: 0,
      name: asset.name,
      viewId: '',
      assetType: asset.asset_type,
      primaryContent: asset.primary_content,
      properties: asset.properties,
      files: asset.files,
      media: asset.media,
      thumbnail: asset.thumbnail,
      keywords: asset.keywords,
      status: asset.status || 'draft',
      teamId: asset.team_id,
      creatorUserId: asset.creator_user_id || '',
      displayName,
      description,
      isPublished: asset.status === 'published',
      viewCount: 0,
      downloadCount: 0,
      createdTimestamp: asset.created_timestamp,
      updatedTimestamp: asset.updated_timestamp,
    };
  }

  private mapView(view: MonkeyView) {
    return {
      id: view.id,
      name: view.name,
      description: view.description || undefined,
      iconUrl: view.icon_url || undefined,
      parentId: view.parent_id || undefined,
      path: view.path,
      level: view.level,
      sort: view.sort,
      filterConfig: undefined,
      displayConfig: view.display_config || undefined,
      creatorUserId: '',
      teamId: view.team_id || undefined,
      isPublic: true,
      assetCount: 0,
      createdTimestamp: view.created_timestamp,
      updatedTimestamp: view.updated_timestamp,
      children: [],
    };
  }

  private buildViewTree(views: MonkeyView[]) {
    const nodes = views.map((view) => this.mapView(view));
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const roots: any[] = [];

    for (const node of nodes) {
      const parentId = node.parentId;
      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  private async fetchAssetsByIds(teamId: string, ids: string[]): Promise<MonkeyAsset[]> {
    const tasks = ids.map(async (id) => {
      try {
        return (await this.client.getAsset(teamId, id)) as MonkeyAsset;
      } catch {
        return null;
      }
    });
    const results = await Promise.all(tasks);
    const byId = new Map<string, MonkeyAsset>();
    for (const asset of results) {
      if (asset) byId.set(asset.id, asset);
    }
    return ids.map((id) => byId.get(id)).filter(Boolean) as MonkeyAsset[];
  }

  private async searchAssets(teamId: string, viewId: string | undefined, tags: string[], name: string | undefined, limit: number, pageToken?: string) {
    const searchRes = await this.client.searchAssets(teamId, {
      viewId,
      tags,
      name,
      limit,
      pageToken: pageToken || undefined,
    });
    const ids = searchRes.items || [];
    const nextToken = searchRes.next_page_token || '';
    const total = typeof searchRes.total === 'number' ? searchRes.total : ids.length;
    const assets = ids.length > 0 ? await this.fetchAssetsByIds(teamId, ids) : [];
    return { assets, nextPageToken: nextToken, total };
  }

  async getAssets(params: {
    adminId: string;
    teamId?: string;
    viewId?: string;
    name?: string;
    tags?: string;
    page?: number;
    pageSize?: number;
  }): Promise<DataListResult> {
    const teamId = this.requireTeamId(params.teamId);
    const pageSize = this.normalizeLimit(params.pageSize);
    const { assets, nextPageToken, total } = await this.searchAssets(
      teamId,
      params.viewId,
      this.parseTags(params.tags),
      params.name,
      pageSize,
      '',
    );
    const list = assets.map((asset) => this.mapAsset(asset));
    return {
      list,
      total: Math.max(total, list.length),
      page: 1,
      pageSize,
      nextPageToken: nextPageToken || undefined,
    };
  }

  async getAssetsNextPage(params: {
    adminId: string;
    teamId?: string;
    viewId?: string;
    name?: string;
    tags?: string;
    pageToken?: string;
    pageSize?: number;
  }): Promise<DataNextPageResult> {
    const teamId = this.requireTeamId(params.teamId);
    const pageSize = this.normalizeLimit(params.pageSize);
    const { assets, nextPageToken } = await this.searchAssets(
      teamId,
      params.viewId,
      this.parseTags(params.tags),
      params.name,
      pageSize,
      params.pageToken,
    );
    const list = assets.map((asset) => this.mapAsset(asset));
    return {
      list,
      hasMore: !!nextPageToken,
      pageSize,
      nextPageToken: nextPageToken || undefined,
    };
  }

  async getAsset(adminId: string, teamId: string | undefined, id: string) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const asset = (await this.client.getAsset(resolvedTeamId, id)) as MonkeyAsset;
    return this.mapAsset(asset);
  }

  async createAsset(adminId: string, params: { teamId?: string; payload: any }) {
    const teamId = this.requireTeamId(params.teamId);
    const payload = params.payload || {};
    const extra = this.buildExtra(payload.extra, payload.displayName, payload.description);

    const requestBody = {
      id: payload.id || undefined,
      creator_user_id: adminId,
      name: payload.name,
      asset_type: payload.assetType,
      primary_content: payload.primaryContent,
      properties: payload.properties,
      files: payload.files,
      media: payload.media,
      thumbnail: payload.thumbnail,
      keywords: payload.keywords,
      status: payload.status,
      extra,
      tag_ids: payload.tagIds,
      created_timestamp: payload.createdTimestamp,
      updated_timestamp: payload.updatedTimestamp,
    };

    const res = await this.client.createAsset(teamId, requestBody);
    const asset = (await this.client.getAsset(teamId, res.id)) as MonkeyAsset;
    return this.mapAsset(asset);
  }

  async updateAsset(adminId: string, params: { teamId?: string; id: string; payload: any }) {
    const teamId = this.requireTeamId(params.teamId);
    const payload = params.payload || {};
    const updates: Record<string, any> = {};

    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.assetType !== undefined) updates.asset_type = payload.assetType;
    if (payload.primaryContent !== undefined) updates.primary_content = payload.primaryContent;
    if (payload.properties !== undefined) updates.properties = payload.properties;
    if (payload.files !== undefined) updates.files = payload.files;
    if (payload.media !== undefined) updates.media = payload.media;
    if (payload.thumbnail !== undefined) updates.thumbnail = payload.thumbnail;
    if (payload.keywords !== undefined) updates.keywords = payload.keywords;
    if (payload.status !== undefined) updates.status = payload.status;

    if (payload.displayName !== undefined || payload.description !== undefined || payload.extra !== undefined) {
      const current = (await this.client.getAsset(teamId, params.id)) as MonkeyAsset;
      const baseExtra = payload.extra ?? current.extra;
      const mergedExtra = this.buildExtra(baseExtra, payload.displayName, payload.description);
      updates.extra = mergedExtra;
    }

    if (Object.keys(updates).length > 0) {
      await this.client.updateAsset(teamId, params.id, updates);
    }

    if (Array.isArray(payload.tagIds)) {
      await this.client.updateAsset(teamId, params.id, { tag_ids: payload.tagIds });
    }

    const asset = (await this.client.getAsset(teamId, params.id)) as MonkeyAsset;
    return this.mapAsset(asset);
  }

  async deleteAsset(adminId: string, teamId: string | undefined, id: string) {
    const resolvedTeamId = this.requireTeamId(teamId);
    await this.client.deleteAsset(resolvedTeamId, id);
  }

  async batchDeleteAssets(adminId: string, teamId: string | undefined, ids: string[]) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const tasks = ids.map((id) => this.client.deleteAsset(resolvedTeamId, id));
    await Promise.all(tasks);
  }

  async listTags(params: { teamId?: string; keyword?: string; limit?: number; pageToken?: string }) {
    const teamId = this.requireTeamId(params.teamId);
    const limit = this.normalizeLimit(params.limit);
    const res = await this.client.listTags(teamId, { keyword: params.keyword, limit, pageToken: params.pageToken });
    const items = (res.items || []) as MonkeyTag[];
    return {
      items: items.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color || undefined,
      })),
      nextPageToken: res.next_page_token || undefined,
    };
  }

  async getViewTree(teamId?: string) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const res = await this.client.getViewTree(resolvedTeamId);
    const views = (res.items || []) as MonkeyView[];
    return this.buildViewTree(views);
  }

  async createView(teamId: string | undefined, payload: any) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const views = await this.getViewTree(resolvedTeamId);
    const viewId = payload.id || nanoid();
    let path = `/${viewId}/`;
    let level = 0;
    let parentId = payload.parentId || undefined;

    if (parentId) {
      const parent = this.findView(views, parentId);
      if (!parent) {
        throw new BadRequestException('parent view not found');
      }
      path = `${parent.path}${parent.id}/`;
      level = (parent.level || 0) + 1;
    }

    const sort = payload.sort ?? this.nextSort(views, parentId);
    const requestBody = {
      id: viewId,
      name: payload.name,
      description: payload.description,
      icon_url: payload.iconUrl,
      parent_id: parentId,
      path,
      level,
      sort,
      display_config: payload.displayConfig,
      created_timestamp: payload.createdTimestamp,
      updated_timestamp: payload.updatedTimestamp,
    };

    const res = await this.client.createView(resolvedTeamId, requestBody);
    if (Array.isArray(payload.tagIds)) {
      await this.client.setViewTags(resolvedTeamId, res.id, payload.tagIds);
    }

    return {
      id: res.id,
      name: payload.name,
      description: payload.description || undefined,
      iconUrl: payload.iconUrl || undefined,
      parentId,
      path,
      level,
      sort,
      filterConfig: undefined,
      displayConfig: payload.displayConfig,
      creatorUserId: '',
      teamId: resolvedTeamId,
      isPublic: true,
      assetCount: 0,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      children: [],
    };
  }

  async updateView(teamId: string | undefined, viewId: string, payload: any) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const updates: Record<string, any> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.iconUrl !== undefined) updates.icon_url = payload.iconUrl;
    if (payload.displayConfig !== undefined) updates.display_config = payload.displayConfig;
    if (payload.sort !== undefined) updates.sort = payload.sort;

    if (Object.keys(updates).length > 0) {
      await this.client.updateView(resolvedTeamId, viewId, updates);
    }

    if (Array.isArray(payload.tagIds)) {
      await this.client.setViewTags(resolvedTeamId, viewId, payload.tagIds);
    }

    return { success: true };
  }

  async deleteView(teamId: string | undefined, viewId: string) {
    const resolvedTeamId = this.requireTeamId(teamId);
    await this.client.deleteView(resolvedTeamId, viewId);
    return { success: true };
  }

  async batchUpdateViewSort(teamId: string | undefined, items: Array<{ id: string; sort: number }>) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const tasks = items.map((item) =>
      this.client.updateView(resolvedTeamId, item.id, { sort: item.sort }),
    );
    await Promise.all(tasks);
    return { success: true };
  }

  async getViewTags(teamId: string | undefined, viewId: string) {
    const resolvedTeamId = this.requireTeamId(teamId);
    const res = await this.client.getViewTags(resolvedTeamId, viewId);
    return { items: res.items || [] };
  }

  private findView(views: any[], id: string): any | undefined {
    for (const view of views) {
      if (view.id === id) return view;
      if (view.children && view.children.length > 0) {
        const found = this.findView(view.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  private nextSort(views: any[], parentId?: string): number {
    const flat: any[] = [];
    const flatten = (items: any[]) => {
      for (const item of items) {
        flat.push(item);
        if (item.children && item.children.length > 0) flatten(item.children);
      }
    };
    flatten(views);
    const siblings = flat.filter((view) => (view.parentId || undefined) === (parentId || undefined));
    if (siblings.length === 0) return 0;
    return Math.max(...siblings.map((view) => view.sort || 0)) + 1;
  }
}
