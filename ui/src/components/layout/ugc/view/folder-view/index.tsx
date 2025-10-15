import React, { useMemo } from 'react';

import { IAssetItem, IListUgcDto } from '@/apis/ugc/typings.ts';
import { UgcViewFolderCard } from '@/components/layout/ugc/view/folder';

interface IFolderViewProps<E extends object> {
  allData: IAssetItem<E>[];
  filter: Partial<IListUgcDto['filter']>;
  renderOptions?: any; // optional
  currentRuleId?: string; // 添加当前规则ID
  assetFilterRules?: any[]; // 添加筛选规则列表
  onFolderClick?: (folderId: string, folderFilter: Partial<IListUgcDto['filter']>) => void;
}

export const UgcViewFolderView = <E extends object>({
  allData,
  filter,
  currentRuleId,
  assetFilterRules = [],
  onFolderClick,
}: IFolderViewProps<E>) => {
  // 生成文件夹数据
  const generateFolderData = useMemo(() => {
    const folders: Array<{
      id: string;
      name: string;
      assetCount: number;
      lastUpdated: string;
      previewImages: string[];
      filterRules: Partial<IListUgcDto['filter']>; // 保存对应的筛选条件
    }> = [];

    const hasSpecificFilter =
      filter &&
      Object.keys(filter).length > 0 &&
      !Object.values(filter).every((v) => v === '' || v === null || v === undefined);

    // 通用匹配方法（支持常用字段）
    const matchByRule = (item: any, rules: Partial<IListUgcDto['filter']> = {}): boolean => {
      const toArr = (v: any): any[] => (Array.isArray(v) ? v : v != null ? [v] : []);

      const groupNames = toArr(rules.groupName);
      if (groupNames.length && !groupNames.includes(item.groupName)) return false;

      const cates = toArr(rules.cate);
      if (cates.length && !cates.includes(item.cate)) return false;

      const itemTagIds: string[] = (item.assetTags || []).map((t: any) => t.id);
      const ruleTagIds = toArr((rules as any).tagIds);
      if (ruleTagIds.length && !ruleTagIds.some((id) => itemTagIds.includes(id))) return false;

      const ruleAssetTagIds = toArr((rules as any).assetTagIds);
      if (ruleAssetTagIds.length && !ruleAssetTagIds.some((id) => itemTagIds.includes(id))) return false;

      const itemMpTagIds: string[] = (item.marketPlaceTags || []).map((t: any) => t.id);
      const ruleMpTagIds = toArr((rules as any).marketPlaceTagIds);
      if (ruleMpTagIds.length && !ruleMpTagIds.some((id) => itemMpTagIds.includes(id))) return false;

      // 创建者匹配：兼容 item.creatorUserId / item.userId / item.user?.id；兼容 rules.userIds[] 与 rules.creatorUserId
      const itemCreatorIds: string[] = [item.creatorUserId, item.userId, item.user?.id].filter(Boolean);
      const ruleUserIds = toArr((rules as any).userIds);
      const ruleCreatorId = (rules as any).creatorUserId;
      if (ruleUserIds.length && !ruleUserIds.some((id) => itemCreatorIds.includes(id))) return false;
      if (ruleCreatorId && !itemCreatorIds.includes(ruleCreatorId as string)) return false;

      return true;
    };

    const getPreviewUrl = (item: any): string => {
      // 先检查文件类型
      const type = (item?.type || item?.mimeType || '') as string;
      const isImage = typeof type === 'string' && type.startsWith('image/');
      
      // 如果是图片类型，优先使用URL
      if (isImage) {
        const url = item && (item.url || item.cover || item.iconUrl || item.thumbnail);
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

    const pickPreviewImages = (items: any[]): string[] => {
      // 优先选择图片文件，然后选择其他文件
      const imageItems = items.filter((it) => {
        const type = (it?.type || it?.mimeType || '') as string;
        return typeof type === 'string' && type.startsWith('image/');
      });
      
      const nonImageItems = items.filter((it) => {
        const type = (it?.type || it?.mimeType || '') as string;
        return !(typeof type === 'string' && type.startsWith('image/'));
      });
      
      // 先取图片，再取非图片文件
      const candidates = [...imageItems, ...nonImageItems];
      
      return candidates
        .slice(0, 4)
        .map((it) => getPreviewUrl(it))
        .filter(Boolean);
    };

    if (hasSpecificFilter) {
      // 有具体筛选：先确定名称
      let folderName = '筛选结果';
      if (assetFilterRules?.length) {
        const isSame = (a: any = {}, b: any = {}) => {
          const norm = (x: any) =>
            JSON.stringify(
              Object.fromEntries(
                Object.entries(x).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)),
              ),
            );
          return norm(a) === norm(b);
        };
        const matched = assetFilterRules.find((r: any) => isSame(r.rules || {}, filter));
        if (matched?.name) folderName = matched.name;
      }
      if (folderName === '筛选结果') {
        if ((filter as any).groupName) folderName = (filter as any).groupName as string;
        else if ((filter as any).cate) folderName = (filter as any).cate as string;
      }

      // 应用筛选条件到数据集
      const items = allData.filter((x: any) => matchByRule(x, filter));
      const previewImages = pickPreviewImages(items);

      const lastUpdatedTime = items.length > 0 ? Math.max(...items.map((item) => item.updatedTimestamp || 0)) : 0;
      const lastUpdatedText = lastUpdatedTime > 0 ? new Date(lastUpdatedTime).toLocaleDateString('zh-CN') : '无';

      folders.push({
        id: 'filtered-folder',
        name: folderName,
        assetCount: items.length,
        lastUpdated: lastUpdatedText,
        previewImages,
        filterRules: filter, // 保存当前筛选条件
      });
    } else {
      // 无具体筛选：按筛选规则分组生成文件夹
      // 使用与左侧筛选相同的逻辑：直接应用每个规则的筛选条件
      const usedIds = new Set<string>();

      assetFilterRules.forEach((rule: any) => {
        const r = rule?.rules ? (rule.rules as Partial<IListUgcDto['filter']>) : {};
        const items = allData.filter((x: any) => {
          // 如果文件已经被其他规则使用，跳过
          if (usedIds.has(x.id)) return false;
          
          // 使用与左侧筛选完全相同的匹配逻辑
          let ok = matchByRule(x, r);
          
          // 如果规则匹配失败，尝试名称匹配（与左侧筛选保持一致）
          if (!ok && rule?.name) {
            const assetTagNames: string[] = (x.assetTags || []).map((t: any) => t.name);
            const mediaTags: string[] = Array.isArray(x.tags) ? x.tags : [];
            ok = (x.groupName && x.groupName === rule.name) || 
                 assetTagNames.includes(rule.name) || 
                 mediaTags.includes(rule.name);
          }
          
          // 只有匹配成功时才标记为已使用
          if (ok) usedIds.add(x.id);
          return ok;
        });
        
        const previewImages = pickPreviewImages(items);
        const t = items.length ? Math.max(...items.map((i) => i.updatedTimestamp || 0)) : 0;
        folders.push({
          id: rule.id,
          name: rule.name || '未命名分组',
          assetCount: items.length,
          lastUpdated: t ? new Date(t).toLocaleDateString('zh-CN') : '无',
          previewImages,
          filterRules: r, // 保存对应的筛选规则
        });
      });
    }

    return folders;
  }, [allData, filter, currentRuleId, assetFilterRules]);

  return (
    <div className="grid w-full grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {generateFolderData.map((folder) => (
        <UgcViewFolderCard
          key={folder.id}
          folderName={folder.name}
          assetCount={folder.assetCount}
          lastUpdated={folder.lastUpdated}
          previewImages={folder.previewImages}
          onClick={() => {
            // 点击文件夹时切换到画廊视图并应用筛选条件
            onFolderClick?.(folder.id, folder.filterRules);
          }}
        />
      ))}
    </div>
  );
};
