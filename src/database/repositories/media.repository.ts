import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { generateDbId } from '@/common/utils';
import { MediaSource } from '@/database/entities/assets/media/media-file';
import { CreateRichMediaDto } from '@/modules/assets/media/dto/req/create-rich-media.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Raw, Repository } from 'typeorm';
import { MediaFileEntity } from '../entities/assets/media/media-file';
import { MediaFileAssetRepositroy } from './assets-media-file.repository';

@Injectable()
export class MediaFileRepository {
  constructor(
    @InjectRepository(MediaFileEntity)
    private readonly mediaFileRepository: Repository<MediaFileEntity>,
    private readonly mediaFileAssetRepositroy: MediaFileAssetRepositroy,
  ) {}

  private async preprocess(records: MediaFileEntity[]) {
    const promises = records.filter(Boolean).map(async (record) => {
      // refresh logo
      if (record.iconUrl) {
        try {
          const s3Helpers = new S3Helpers();
          const { refreshed, refreshedUrl } = await s3Helpers.refreshSignedUrl(record.iconUrl);
          if (refreshed) {
            record.iconUrl = refreshedUrl;
            await this.mediaFileRepository.save(record);
          }
        } catch (e) {}
      }
      record.url = encodeURI(record.url);
    });
    await Promise.all(promises);
  }

  public async listRichMedias(teamId: string, dto: ListDto, excludeIds?: string[], filterNeuralModel?: 'only' | 'exclude' | 'all') {
    // 构建 extraWhere 条件，使用 LIKE 查询在数据库层过滤 JSON 字符串
    let extraWhere: any = undefined;

    if (filterNeuralModel === 'only') {
      // 只显示 neural-model：使用 LIKE 匹配 JSON 字符串中的 type 字段
      // params 存储格式: {"type":"neural-model",...}
      extraWhere = {
        params: Like('%"type":"neural-model"%'),
      };
    } else if (filterNeuralModel === 'exclude') {
      // 排除 neural-model：需要包含 params 为 NULL 或不包含 neural-model 的记录
      // 使用 Raw 查询来正确处理 NULL 值
      extraWhere = {
        params: Raw((alias) => `(${alias} IS NULL OR ${alias} NOT LIKE '%"type":"neural-model"%')`),
      };
    }
    // filterNeuralModel === 'all' 时，extraWhere 保持 undefined

    // 使用数据库层的过滤和分页
    const { list, totalCount } = await this.mediaFileAssetRepositroy.listAssets(
      'media-file',
      teamId,
      dto,
      {
        withTags: true,
        withTeam: true,
        withUser: true,
      },
      undefined,
      extraWhere,
      excludeIds,
    );

    await this.preprocess(list);
    return {
      list,
      totalCount,
    };
  }

  public async updateMedia(id: string, teamId: string, updates: { iconUrl?: string; displayName?: string; description?: string; params?: any }) {
    const media = await this.mediaFileRepository.findOne({
      where: {
        id,
        teamId,
        isDeleted: false,
      },
    });

    if (!media) {
      return null;
    }

    if (updates.iconUrl !== undefined) {
      media.iconUrl = updates.iconUrl;
    }
    if (updates.displayName !== undefined) {
      media.displayName = updates.displayName;
    }
    if (updates.description !== undefined) {
      media.description = updates.description;
    }
    if (updates.params !== undefined) {
      media.params = updates.params;
    }

    media.updatedTimestamp = Date.now();
    return await this.mediaFileRepository.save(media);
  }

  public async deleteMedia(teamId: string, id: string) {
    const data = await this.mediaFileRepository.findOne({
      where: {
        id,
        teamId,
      },
    });
    if (!data) {
      return;
    }
    await this.mediaFileRepository.update(
      {
        id,
        teamId,
      },
      {
        isDeleted: true,
      },
    );
  }

  public async getMediaById(id: string) {
    const data = await this.mediaFileRepository.findOne({
      where: {
        id: id,
      },
    });
    await this.preprocess([data]);
    return data;
  }

  public async getMediaByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }
    const data = await this.mediaFileRepository.findBy({
      id: In(ids),
      isDeleted: false,
    });
    await this.preprocess(data);
    return data;
  }

  public async getMediaByMd5(teamId: string, md5: string) {
    const data = await this.mediaFileRepository.findOne({
      where: {
        md5,
        teamId,
        isDeleted: false,
      },
    });
    await this.preprocess([data]);
    return data;
  }

  public async createMedia(teamId: string, userId: string, body: CreateRichMediaDto) {
    const { url, source = MediaSource.UPLOAD, displayName, description, params, type, size, md5 } = body;
    const mediaId = generateDbId();
    await this.mediaFileRepository.save({
      id: mediaId,
      iconUrl: '',
      description: description || '',
      type,
      teamId,
      creatorUserId: userId,
      displayName,
      url,
      source: source as any,
      params,
      size,
      md5,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });
    return await this.getMediaById(mediaId);
  }

  public async getMediaByIdAndTeamId(id: string, teamId: string) {
    console.log('🔍 [DEBUG] getMediaByIdAndTeamId called with:', { id, teamId });

    const data = await this.mediaFileRepository.findOne({
      where: {
        id: id,
        teamId: teamId,
      },
    });

    if (!data) {
      console.log('❌ [DEBUG] Media file not found');
      return null;
    }

    console.log('✅ [DEBUG] Found media file:', {
      id: data.id,
      displayName: data.displayName,
      assetType: data.assetType,
    });

    await this.preprocess([data]);

    // 填充额外信息（标签、团队、用户），与列表查询保持一致
    const [enrichedData] = await this.mediaFileAssetRepositroy.assetCommonRepository.fillAdditionalInfoList([data], {
      withTags: true,
      withTeam: true,
      withUser: true,
    });

    console.log('📦 [DEBUG] Enriched data:', {
      id: enrichedData?.id,
      hasAssetTags: !!enrichedData?.assetTags,
      assetTagsCount: enrichedData?.assetTags?.length || 0,
      assetTags: enrichedData?.assetTags,
      hasUser: !!enrichedData?.user,
      hasTeam: !!enrichedData?.team,
    });

    return enrichedData;
  }

  public async togglePin(mediaId: string, teamId: string, pinned: boolean) {
    if (pinned) {
      // 置顶：找到当前最大的 sort 值，然后设置为比它更大的值
      const maxSortMedia = await this.mediaFileRepository.findOne({
        where: {
          teamId,
          isDeleted: false,
        },
        order: {
          sort: 'DESC',
        },
      });

      // 获取当前最大值，如果存在则 +1，否则设置为 1（因为默认是0）
      const newSort = maxSortMedia?.sort != null ? maxSortMedia.sort + 1 : 1;

      await this.mediaFileRepository.update(mediaId, {
        sort: newSort,
        updatedTimestamp: Date.now(),
      });
    } else {
      // 取消置顶：将 sort 设置为 0（默认值）
      await this.mediaFileRepository.update(mediaId, {
        sort: 0,
        updatedTimestamp: Date.now(),
      });
    }
  }

  /**
   * 获取文件夹视图数据，每个分组返回4张预览图
   */
  public async listRichMediasForFolderView(teamId: string, search?: string) {
    // 获取所有筛选规则
    const assetCommonRepository = this.mediaFileAssetRepositroy.assetCommonRepository;
    const filters = await assetCommonRepository.listFilters(teamId, 'media-file');

    // 获取预览图的辅助函数
    const getPreviewUrl = (item: any): string => {
      // 优先使用 iconUrl（缩略图）
      if (item?.iconUrl) {
        return item.iconUrl;
      }

      // 先检查文件类型
      const type = (item?.type || item?.mimeType || '') as string;
      const isImage = typeof type === 'string' && type.startsWith('image/');

      // 如果是图片类型，使用URL
      if (isImage) {
        const url = item && (item.url || item.cover || item.thumbnail);
        if (url) {
          return url;
        }
      }

      // 如果不是图片类型，使用文件夹图标作为回退图标
      if (!isImage) {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zIDVWOVYxOUMzIDE5LjU1MjMgMy40NDc3IDIwIDQgMjBIMjBDMjAuNTUyMyAyMCAyMSAxOS41NTIzIDIxIDE5VjlDMjEgOC40NDc3MiAyMC41NTIzIDggMjAgOEgxMkwxMCA2SDRDMy40NDc3MiA2IDMgNS40NDc3MiAzIDVaIiBmaWxsPSIjNjM2NkYxIi8+Cjwvc3ZnPg==';
      }

      return '';
    };

    // 判断是否置顶
    const isPinned = (item: any): boolean => {
      return (item?.sort ?? 0) > 0;
    };

    // 选择预览图（最多4张）
    const pickPreviewImages = (items: any[]): string[] => {
      // 分类文件：置顶文件、图片文件、其他文件
      const pinnedItems = items.filter((it) => isPinned(it));
      const imageItems = items.filter((it) => {
        const type = (it?.type || it?.mimeType || '') as string;
        return typeof type === 'string' && type.startsWith('image/') && !isPinned(it);
      });
      const otherItems = items.filter((it) => {
        const type = (it?.type || it?.mimeType || '') as string;
        return !(typeof type === 'string' && type.startsWith('image/')) && !isPinned(it);
      });

      // 优先级：置顶文件 > 图片文件 > 其他文件
      const candidates = [...pinnedItems, ...imageItems, ...otherItems];

      return candidates
        .slice(0, 4)
        .map((it) => getPreviewUrl(it))
        .filter(Boolean);
    };

    // 选择预览资产（最多4个）
    const pickPreviewAssets = (items: any[]): any[] => {
      // 分类文件：置顶文件、图片文件、其他文件
      const pinnedItems = items.filter((it) => isPinned(it));
      const imageItems = items.filter((it) => {
        const type = (it?.type || it?.mimeType || '') as string;
        return typeof type === 'string' && type.startsWith('image/') && !isPinned(it);
      });
      const otherItems = items.filter((it) => {
        const type = (it?.type || it?.mimeType || '') as string;
        return !(typeof type === 'string' && type.startsWith('image/')) && !isPinned(it);
      });

      // 优先级：置顶文件 > 图片文件 > 其他文件
      const candidates = [...pinnedItems, ...imageItems, ...otherItems];

      return candidates.slice(0, 4);
    };

    const folders: Array<{
      id: string;
      name: string;
      assetCount: number;
      lastUpdated: string;
      previewImages: string[];
      previewAssets: any[];
      filterRules: any;
    }> = [];

    // 遍历每个筛选规则
    for (const rule of filters) {
      const filterRules = rule.rules || {};

      // 确保 tagIdsAnd 字段正确传递（如果存在）
      // 因为 AssetFilterRule 接口可能没有这个字段，但实际存储的 JSON 中可能有
      const finalFilterRules = { ...filterRules };
      if ((rule.rules as any)?.tagIdsAnd !== undefined) {
        (finalFilterRules as any).tagIdsAnd = (rule.rules as any).tagIdsAnd;
      }

      // 查询匹配的资产（获取足够数量用于预览图选择，每个分组独立选择预览图）
      const { list: items } = await this.mediaFileAssetRepositroy.listAssets(
        'media-file',
        teamId,
        {
          page: 1,
          limit: 100, // 获取前100个用于选择预览图
          search: search || undefined,
          filter: finalFilterRules,
          orderBy: 'DESC',
          orderColumn: 'createdTimestamp',
        },
        {
          withTags: true,
          withTeam: true,
          withUser: true,
        },
      );

      // 获取总数（用于显示资产数量）
      const { totalCount: rawTotalCount } = await this.mediaFileAssetRepositroy.listAssets(
        'media-file',
        teamId,
        {
          page: 1,
          limit: 1,
          search: search || undefined,
          filter: finalFilterRules,
          orderBy: 'DESC',
          orderColumn: 'createdTimestamp',
        },
        {
          withTags: true,
          withTeam: true,
          withUser: true,
        },
      );

      // 预处理数据（使用原始查询结果，每个分组独立选择预览图）
      await this.preprocess(items);

      // 选择预览图（使用原始查询结果，确保每个分组都能显示足够的预览图）
      const previewImages = pickPreviewImages(items);
      const previewAssets = pickPreviewAssets(items);

      // 计算最后更新时间
      const lastUpdatedTime = items.length > 0 ? Math.max(...items.map((item) => item.updatedTimestamp || 0)) : 0;
      const lastUpdatedText = lastUpdatedTime > 0 ? new Date(lastUpdatedTime).toLocaleDateString('zh-CN') : '无';

      folders.push({
        id: rule.id,
        name: rule.name || '未命名分组',
        assetCount: rawTotalCount,
        lastUpdated: lastUpdatedText,
        previewImages,
        previewAssets,
        filterRules: finalFilterRules,
      });
    }

    return folders;
  }
}
