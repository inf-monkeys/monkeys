import { generateDbId } from '@/common/utils';
import { AgentV2Entity } from '@/database/entities/agent-v2/agent-v2.entity';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';
import { DesignMetadataEntity } from '@/database/entities/design/design-metatdata';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { WorkflowBuiltinPinnedPageEntity } from '@/database/entities/workflow/workflow-builtin-pinned-page';
import { PageInstanceType, WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { BUILT_IN_PAGE_INSTANCES, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty, keyBy, pick, pickBy, set, uniq } from 'lodash';
import { In, IsNull, Repository } from 'typeorm';
import { marketplaceDataManager } from '../marketplace/services/marketplace.data';
import { CreatePageDto } from './dto/req/create-page.dto';
import { UpdatePageGroupDto, UpdatePagesDto } from './dto/req/update-pages.dto';
import { WorkflowPageJson, WorkflowPageUpdateJson } from './interfaces';

@Injectable()
export class WorkflowPageService {
  constructor(
    @InjectRepository(WorkflowPageEntity)
    private readonly pageRepository: Repository<WorkflowPageEntity>,
    @InjectRepository(WorkflowPageGroupEntity)
    private readonly pageGroupRepository: Repository<WorkflowPageGroupEntity>,
    @InjectRepository(WorkflowBuiltinPinnedPageEntity)
    private readonly builtinPinnedPageRepository: Repository<WorkflowBuiltinPinnedPageEntity>,
    @InjectRepository(ConversationAppEntity)
    private readonly conversationAppRepository: Repository<ConversationAppEntity>,
    @InjectRepository(AgentV2Entity)
    private readonly agentV2Repository: Repository<AgentV2Entity>,
    @InjectRepository(DesignMetadataEntity)
    private readonly designMetadataRepository: Repository<DesignMetadataEntity>,
    @InjectRepository(DesignProjectEntity)
    private readonly designProjectRepository: Repository<DesignProjectEntity>,
    private readonly workflowRepository: WorkflowRepository,
  ) {}

  async listWorkflowPages(workflowId: string) {
    return await this.workflowRepository.listWorkflowPagesAndCreateIfNotExists(workflowId);
  }

  async listWorkflowPagesBrief(workflowId: string): Promise<WorkflowPageJson[]> {
    const pages = await this.listWorkflowPages(workflowId);
    return pages.map((page) => ({
      displayName: page.displayName,
      pinned: page.pinned,
      isBuiltIn: page.isBuiltIn,
      sortIndex: page.sortIndex,
      type: page.type,
      permissions: page.permissions,
    }));
  }

  async importWorkflowPage(workflowId: string, teamId: string, pages: WorkflowPageJson[]) {
    // 创建一个数组来收集需要 pin 的页面 ID
    const pinnedPageIds: string[] = [];

    const allPages: WorkflowPageEntity[] = [];

    // 首先创建所有页面
    for (const { displayName, sortIndex, pinned, type, isBuiltIn, permissions } of pages) {
      const pageId = generateDbId();
      const page: WorkflowPageEntity = {
        id: pageId,
        type,
        displayName,
        workflowId,
        isBuiltIn,
        teamId,
        permissions,
        customOptions: {},
        sortIndex,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
        isDeleted: false,
        pinned,
      };
      const result = await this.pageRepository.save(page);
      allPages.push(result);

      // 如果页面需要被 pin，将其 ID 添加到收集数组中
      if (pinned) {
        pinnedPageIds.push(pageId);
      }
    }

    // 如果有需要 pin 的页面，处理分组
    if (pinnedPageIds.length > 0) {
      // 获取或创建 default 分组
      const [defaultGroup] = await this.workflowRepository.getPageGroupsAndCreateIfNotExists(teamId, ['default']);

      // 更新分组中的页面列表
      const existingPageIds = defaultGroup.pageIds || [];
      const updatedPageIds = uniq([...existingPageIds, ...pinnedPageIds]);

      // 保存更新后的分组
      await this.workflowRepository.updatePageGroup(defaultGroup.id, {
        pageIds: updatedPageIds,
      });
    }

    return allPages;
  }

  async updateWorkflowPage(workflowId: string, pages: WorkflowPageUpdateJson[]) {
    const oldPages = await this.listWorkflowPages(workflowId);
    for (const { id, displayName, sortIndex, pinned, type, isBuiltIn, permissions } of pages) {
      const oldPage = oldPages.find((page) => page.id === id);
      if (!oldPage) continue;
      oldPage.displayName = displayName;
      oldPage.sortIndex = sortIndex;
      oldPage.pinned = pinned;
      oldPage.type = type;
      oldPage.isBuiltIn = isBuiltIn;
      oldPage.permissions = permissions;
      oldPage.updatedTimestamp = Date.now();
      await this.pageRepository.save(oldPage);
    }
  }

  async createWorkflowPage(workflowId: string, teamId: string, userId: string, body: CreatePageDto) {
    const { sortIndex, type, permissions, displayName, customOptions } = body;
    let sortIndexValue = sortIndex;
    if (typeof sortIndexValue === 'undefined') {
      const lastIndexPage = await this.pageRepository.findOne({ where: { teamId, workflowId, isDeleted: false }, order: { sortIndex: -1 } });
      if (lastIndexPage?.sortIndex) {
        sortIndexValue = lastIndexPage.sortIndex + 1;
      } else {
        sortIndexValue = 9999;
      }
    }
    const pageId = generateDbId();
    const page: WorkflowPageEntity = {
      id: pageId,
      type,
      displayName,
      workflowId,
      isBuiltIn: false,
      teamId,
      permissions,
      customOptions,
      sortIndex: sortIndexValue,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };

    await this.pageRepository.save(page);
    return this.listWorkflowPages(workflowId);
  }

  async updateWorkflowPages(workflowId: string, teamId: string, userId: string, body: UpdatePagesDto) {
    const { pages: pagesUpdates } = body;
    for (const update of pagesUpdates) {
      const { pageId, permissions, displayName, sortIndex, customOptions } = update ?? {};
      if (!pageId) continue;
      await this.pageRepository.update(
        {
          id: pageId,
          teamId,
          workflowId,
        },
        {
          ...pickBy({ permissions, displayName, sortIndex, customOptions }, (v) => typeof v !== 'undefined'),
          updatedTimestamp: Date.now(),
        },
      );
    }
    return this.listWorkflowPages(workflowId);
  }

  /**
   * 为指定 workflow 添加一个全局内置 pinned 视图配置
   * - 不绑定具体的 pageId / groupId
   * - 仅在 getPinnedPages 时按需解析为虚拟 pinned 视图
   */
  public async addBuiltinPinnedPage(
    workflowId: string,
    pageType: 'process' | 'log' | 'preview' | 'chat' = 'preview',
    options?: {
      /**
       * 目标分组 key（通常写入 preset app sort group id），用于在 getPinnedPages 时决定注入到哪个工作台文件夹。
       * - 不传 / 为空：注入到默认内置分组
       */
      groupKey?: string | null;
      /**
       * 可选排序，用于在配置层面排序
       */
      sortIndex?: number | null;
    },
  ) {
    // NOTE:
    // - groupKey 是区分「同一个 workflow + pageType」落到不同工作台分组的关键
    // - 即使调用方未显式传 options/groupKey，也应当把它视作 "null"（默认分组）参与查询
    const groupKey = options?.groupKey ?? null;
    const exists = await this.builtinPinnedPageRepository.findOne({
      where: {
        workflowId,
        pageType,
        // 永远带上 groupKey，避免误命中其它分组的记录
        groupKey: groupKey === null ? IsNull() : groupKey,
        isDeleted: false,
      },
    });
    if (exists) {
      const nextGroupKey = typeof options?.groupKey === 'undefined' ? exists.groupKey : options?.groupKey ?? null;
      const nextSortIndex = typeof options?.sortIndex === 'undefined' ? exists.sortIndex : options?.sortIndex ?? null;
      const needUpdate = exists.groupKey !== nextGroupKey || exists.sortIndex !== nextSortIndex;
      if (!needUpdate) return exists;

      exists.groupKey = nextGroupKey ?? null;
      exists.sortIndex = typeof nextSortIndex === 'number' ? nextSortIndex : (nextSortIndex ?? null);
      exists.updatedTimestamp = Date.now();
      return await this.builtinPinnedPageRepository.save(exists);
    }

    const entity = this.builtinPinnedPageRepository.create({
      id: generateDbId(),
      workflowId,
      pageType,
      ...(typeof options?.groupKey !== 'undefined' ? { groupKey: options?.groupKey ?? null } : {}),
      ...(typeof options?.sortIndex !== 'undefined' ? { sortIndex: options?.sortIndex ?? null } : {}),
    });
    return await this.builtinPinnedPageRepository.save(entity);
  }

  public async removeBuiltinPinnedPagesForWorkflow(workflowId: string, pageType?: PageInstanceType) {
    await this.builtinPinnedPageRepository.update(
      {
        workflowId,
        ...(pageType ? { pageType } : {}),
        isDeleted: false,
      },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      },
    );
  }

  /**
   * 当作者团队修改「表单视图固定分组」后，同步到全局 builtin pinned 配置，
   * 使其它团队无需取消/重新设置内置应用即可生效。
   */
  private async syncBuiltinPinnedPreviewFromAuthorGroup(teamId: string, workflowId: string) {
    // 仅对已存在 builtin pinned 配置的 workflow 生效（也就是已经被设置为内置应用）
    const hasBuiltinPinned = await this.builtinPinnedPageRepository.findOne({
      where: { workflowId, isDeleted: false },
      select: ['id'],
    });
    if (!hasBuiltinPinned) return;

    const previewPage = await this.pageRepository.findOne({
      where: {
        teamId,
        workflowId,
        type: 'preview',
        isDeleted: false,
      },
    });
    if (!previewPage) return;

    const groups = await this.pageGroupRepository.find({
      where: { teamId },
      order: { sortIndex: 1 },
    });
    const matchedGroups = (groups ?? []).filter((g) => (g.pageIds ?? []).includes(previewPage.id));
    const groupKeys = uniq(
      matchedGroups
        .map((g) => {
          if (g.isBuiltIn) return 'default';
          if ((g as any).presetRelationId) return (g as any).presetRelationId as string;
          return this.normalizeGroupLabel((g as any).displayName);
        })
        .filter(Boolean)
        .map((s) => (s as string).trim())
        .filter((s) => s.length > 0 && s.length <= 255),
    );

    // 只同步 preview，避免影响未来可能存在的其它 pageType 配置
    await this.removeBuiltinPinnedPagesForWorkflow(workflowId, 'preview');

    if (groupKeys.length === 0) {
      // 作者团队未将 preview 固定到任何分组：回退默认注入（NULL groupKey）
      await this.addBuiltinPinnedPage(workflowId, 'preview');
      return;
    }

    for (const gk of groupKeys) {
      await this.addBuiltinPinnedPage(workflowId, 'preview', { groupKey: gk });
    }
  }

  private async syncBuiltinPinnedPreviewForTeamByPageIds(teamId: string, pageIds: string[]) {
    const ids = uniq((pageIds ?? []).filter(Boolean));
    if (ids.length === 0) return;

    const previewPages = await this.pageRepository.find({
      where: {
        teamId,
        id: In(ids),
        type: 'preview',
        isDeleted: false,
      },
    });
    const workflowIds = uniq(previewPages.map((p) => p.workflowId));
    for (const wid of workflowIds) {
      await this.syncBuiltinPinnedPreviewFromAuthorGroup(teamId, wid);
    }
  }

  async removeWorkflowPage(workflowId: string, teamId: string, userId: string, pageId: string) {
    await this.pageRepository.update(
      {
        id: pageId,
        teamId,
        workflowId,
      },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      },
    );
    return this.listWorkflowPages(workflowId);
  }

  async getWorkflowPageByPageId(pageId: string) {
    const page = await this.pageRepository.findOne({
      where: {
        id: pageId,
        isDeleted: false,
      },
    });
    if (!page) return null;
    const pageInstanceTypeMapper = keyBy(BUILT_IN_PAGE_INSTANCES, 'type');
    return {
      ...page,
      instance: pageInstanceTypeMapper[page.type],
    };
  }

  splitPageIds(pageIds: (string | null)[]) {
    const agentPageIds = pageIds.filter((id) => id && id.startsWith('agent-'));
    const agentV2PageIds = pageIds.filter((id) => id && id.startsWith('agentv2-'));
    const designBoardPageIds = pageIds.filter((id) => id && id.startsWith('design-board-'));
    const normalPageIds = pageIds.filter((id) => id && !designBoardPageIds.includes(id) && !agentPageIds.includes(id) && !agentV2PageIds.includes(id));
    return { agentPageIds, agentV2PageIds, designBoardPageIds, normalPageIds };
  }

  private normalizeGroupLabel(displayName: any): string | null {
    if (!displayName) return null;
    if (typeof displayName === 'string') {
      const s = displayName.trim();
      // displayName 可能是 JSON 字符串（I18nValue），尽量取 zh-CN，否则取第一个 value
      if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('"') && s.endsWith('"'))) {
        try {
          const parsed = JSON.parse(s);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed['zh-CN'] === 'string' && parsed['zh-CN'].trim()) return parsed['zh-CN'].trim();
            const first = Object.values(parsed).find((v) => typeof v === 'string' && (v as string).trim());
            if (typeof first === 'string') return first.trim();
          }
        } catch {
          // ignore
        }
      }
      return s || null;
    }
    if (typeof displayName === 'object') {
      if (typeof displayName['zh-CN'] === 'string' && displayName['zh-CN'].trim()) return displayName['zh-CN'].trim();
      const first = Object.values(displayName).find((v) => typeof v === 'string' && (v as string).trim());
      if (typeof first === 'string') return first.trim();
    }
    return null;
  }

  private normalizeGroupKeyToLabel(groupKey: string): string {
    const s = (groupKey ?? '').trim();
    if (!s) return s;
    // 兼容旧数据：group_key 可能被写成 JSON 字符串（I18nValue）
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object') {
          const zh = parsed['zh-CN'];
          if (typeof zh === 'string' && zh.trim()) return zh.trim();
          const first = Object.values(parsed).find((v) => typeof v === 'string' && (v as string).trim());
          if (typeof first === 'string') return first.trim();
        }
      } catch {
        // ignore
      }
    }
    return s;
  }

  public async getPinnedPages(teamId: string) {
    if (isEmpty(teamId)) {
      return { pages: [], groups: [] };
    }

    let groups = await this.pageGroupRepository.find({
      where: {
        teamId,
      },
      order: {
        sortIndex: 1,
      },
    });

    // 确保每个团队至少有一个内置（默认）分组，便于挂载全局内置 pinned 视图
    // 对于新注册的团队，如果还没有任何 page group，这里会自动创建一个 isBuiltIn = true 的默认分组
    if (!groups.some((g) => g.isBuiltIn)) {
      const defaultGroup = await this.workflowRepository.getDefaultPageGroupAndCreateIfNotExists(teamId);
      groups = groups.concat(defaultGroup);
    }

    const pageIds = uniq(groups.map((it) => it.pageIds).flat(1)) as string[];

    const { agentPageIds, agentV2PageIds, designBoardPageIds, normalPageIds } = this.splitPageIds(pageIds);

    const pages = await this.pageRepository.find({
      where: {
        teamId,
        id: In(normalPageIds),
        isDeleted: false,
      },
    });

    const pageIdsSet = new Set<string>();
    const filteredPages = pages.filter((it) => {
      if (pageIdsSet.has(it.id)) {
        return false;
      }
      pageIdsSet.add(it.id);
      return true;
    });

    const workflowIds = uniq(filteredPages.map((page) => page.workflowId));
    let workflows = await this.workflowRepository.findWorkflowByIds(workflowIds);
    const workflowMap = keyBy(workflows, 'workflowId');
    const pageInstanceTypeMapper = keyBy(BUILT_IN_PAGE_INSTANCES, 'type');

    // agent page
    const [agentIds, agentPageInfo] = agentPageIds.reduce(
      ([ids, map], str) => {
        const match = str.match(/agent-(\w+)-(\w+)/);
        if (match) {
          const [, id, type] = match;
          ids.push(id);
          map[str] = {
            type,
            id,
          };
        }
        return [ids, map];
      },
      [[], {}],
    ) as [string[], Record<string, Record<string, string>>];
    const agentApps = await this.conversationAppRepository.find({
      where: {
        teamId,
        isDeleted: false,
        id: In(agentIds),
      },
    });
    const agentPages = agentPageIds.map((agentPageId) => {
      const { type, id } = agentPageInfo[agentPageId];
      const isChat = type === 'chat';

      return {
        agent: agentApps.find((it) => it.id === id),
        id: agentPageId,
        type: 'agent-' + type,
        displayName: isChat ? '对话视图' : '配置视图',
        agentId: id,
        instance: {
          name: isChat ? '对话视图' : '配置视图',
          icon: isChat ? 'square-play' : 'bolt',
          type,
        },
      };
    });

    // agentv2 page
    const [agentV2Ids, agentV2PageInfo] = agentV2PageIds.reduce(
      ([ids, map], str) => {
        const match = str.match(/agentv2-(\w+)-(\w+)/);
        if (match) {
          const [, id, type] = match;
          ids.push(id);
          map[str] = {
            type,
            id,
          };
        }
        return [ids, map];
      },
      [[], {}],
    ) as [string[], Record<string, Record<string, string>>];
    const agentV2Apps = await this.agentV2Repository.find({
      where: {
        teamId,
        isDeleted: false,
        id: In(agentV2Ids),
      },
    });
    const agentV2Pages = agentV2PageIds.map((agentV2PageId) => {
      const { type, id } = agentV2PageInfo[agentV2PageId];
      const isChat = type === 'chat';

      return {
        agent: agentV2Apps.find((it) => it.id === id),
        id: agentV2PageId,
        type: 'agentv2-' + type,
        displayName: isChat ? '对话视图' : '配置视图',
        agentId: id,
        instance: {
          name: isChat ? '对话视图' : '配置视图',
          icon: isChat ? 'square-play' : 'bolt',
          type,
        },
      };
    });

    // design board
    const [designBoardIds] = designBoardPageIds.reduce(
      ([ids, map], str) => {
        const match = str.match(/design-board-(\w+)/);
        if (match) {
          const [, id, type] = match;
          ids.push(id);
          map[str] = {
            type,
            id,
          };
        }
        return [ids, map];
      },
      [[], {}],
    ) as [string[], Record<string, Record<string, string>>];
    const designMetadata = await this.designMetadataRepository.find({
      where: {
        teamId,
        isDeleted: false,
        id: In(designBoardIds),
      },
    });
    const designProjects = await this.designProjectRepository.find({
      where: {
        teamId,
        isDeleted: false,
        id: In(designMetadata.map((it) => it.designProjectId)),
      },
    });

    const designBoardPages = designBoardPageIds.map((designBoardPageId, i) => {
      const designMetadataId = designBoardIds[i];
      const designMetadataItem = designMetadata.find((it) => it.id === designMetadataId);
      return {
        designProject: designProjects.find((it) => it.id === designMetadataItem.designProjectId),
        id: designBoardPageId,
        designMetadataId,
        type: 'design-board',
        displayName: designMetadataItem.displayName,
        instance: {
          name: '画板视图',
          icon: 'pencil-ruler',
          type: 'design-board',
        },
      };
    });

    // 合并所有页面（团队本地 pinned + agent + design board 等）
    const allPagesBase = [
      ...filteredPages.map((p) => ({
        ...p,
        workflow: workflowMap[p.workflowId],
        instance: pageInstanceTypeMapper[p.type],
      })),
      ...agentPages,
      ...agentV2Pages,
      ...designBoardPages,
    ];

    // 追加「内置应用」全局固定视图（不与具体 pageId 绑定）
    const builtinPinnedConfigs = await this.builtinPinnedPageRepository.find({
      where: {
        isDeleted: false,
      },
      order: {
        sortIndex: 1,
      },
    });

    let allPages = allPagesBase;
    let groupsWithBuiltin = groups;

    if (builtinPinnedConfigs.length > 0) {
      const builtinWorkflowIds = uniq(builtinPinnedConfigs.map((pin) => pin.workflowId));

      // 补充当前 teams 已经没有加载到的 workflow 元数据
      const missingWorkflowIds = builtinWorkflowIds.filter((id) => !workflowMap[id]);
      if (missingWorkflowIds.length > 0) {
        const extraWorkflows = await this.workflowRepository.findWorkflowByIds(missingWorkflowIds);
        workflows = [...workflows, ...extraWorkflows];
        const extraWorkflowMap = keyBy(extraWorkflows, 'workflowId');
        Object.assign(workflowMap, extraWorkflowMap);
      }

      // 如果某团队已经在分组里固定了某 workflow 的真实页面（例如作者团队自己 pin 了 preview），
      // 则不要再注入 builtin 虚拟页，避免出现「重复工作流卡片」。
      const existingPinnedWorkflowTypeKey = new Set<string>(
        filteredPages.map((p) => `${p.workflowId}:${p.type}`),
      );

      const builtinPagesWithConfig = builtinPinnedConfigs
        .map((pin) => {
          if (existingPinnedWorkflowTypeKey.has(`${pin.workflowId}:${pin.pageType}`)) {
            return null;
          }
          const workflow = workflowMap[pin.workflowId];
          if (!workflow) return null;

          const pageType = pin.pageType;
          const instance = pageInstanceTypeMapper[pageType];
          if (!instance) return null;

          const id = `builtin-${pin.workflowId}-${pageType}`;

          return {
            groupKey: pin.groupKey ?? null,
            page: {
              id,
              type: pageType,
              // 关键：显式带上 workflowId，让前端识别为 workflow 视图分组
              workflowId: pin.workflowId,
              displayName: workflow.displayName as any,
              workflow,
              instance,
              // 标记为全局内置 pinned，前端如有需要可以据此区分只读/不可删除等
              isBuiltinPinned: true,
            } as any,
          };
        })
        .filter(Boolean);

      if (builtinPagesWithConfig.length > 0) {
        // 去重：同一个 workflow+pageType 可能配置了多个 groupKey（表单视图固定可多选），pageId 会重复
        const builtinPageMap = new Map<string, any>();
        for (const it of builtinPagesWithConfig as any[]) {
          const p = it?.page;
          if (p?.id) builtinPageMap.set(p.id, p);
        }
        const builtinPages = Array.from(builtinPageMap.values());
        allPages = [...allPagesBase, ...builtinPages];

        // 虚拟注入到当前团队的分组：
        // - 若配置了 groupKey（通常是 preset app sort group id），则注入到对应文件夹（不存在则自动创建）
        // - 否则注入到默认内置分组（isBuiltIn = true 的 group）
        groupsWithBuiltin = groups.map((g) => ({ ...g }));

        const defaultGroup = groupsWithBuiltin.find((g) => g.isBuiltIn);
        const groupIdToBuiltinIds = new Map<string, string[]>();

        for (const item of builtinPagesWithConfig as any[]) {
          const pageId = item?.page?.id as string | undefined;
          if (!pageId) continue;

          let targetGroup: any | undefined = undefined;
          const rawGroupKey = (item?.groupKey ?? null) as string | null;
          const groupKey = rawGroupKey ? this.normalizeGroupKeyToLabel(rawGroupKey) : rawGroupKey;
          if (groupKey === 'default') {
            targetGroup = defaultGroup as any;
          } else if (groupKey) {
            // 1) 优先找已存在的 preset 分组
            targetGroup = groupsWithBuiltin.find((g) => (g as any).presetRelationId === groupKey);

            // 1.5) 再按“展示名”匹配（避免同名分组被重复创建：displayName 可能是 JSON i18n）
            if (!targetGroup) {
              targetGroup = groupsWithBuiltin.find((g) => this.normalizeGroupLabel((g as any).displayName) === groupKey);
            }

            // 2) 不存在则创建（并加入当前返回的 groups 中）
            if (!targetGroup) {
              try {
                // groupKey 可能是 presetRelationId，也可能是纯 displayName
                const presetCandidate = marketplaceDataManager.presetAppSort.find((it) => it.id === groupKey);
                if (presetCandidate) {
                  const created = await this.getPageGroupByPresetId(teamId, groupKey);
                  groupsWithBuiltin.push(created as any);
                  targetGroup = created as any;
                } else {
                  // 使用 displayName 创建一个普通分组（不绑定 presetRelationId）
                  const i18nDisplayName = JSON.stringify({ 'zh-CN': groupKey, 'en-US': groupKey });
                  const created = (await this.createPageGroup(teamId, i18nDisplayName)).slice(-1)[0];
                  groupsWithBuiltin.push(created as any);
                  targetGroup = created as any;
                }
              } catch (_e) {
                // groupKey 无法解析时，回退默认分组
                targetGroup = undefined;
              }
            }
          }

          if (!targetGroup) {
            targetGroup = defaultGroup as any;
          }
          if (!targetGroup) continue;

          const gid = targetGroup.id as string;
          const list = groupIdToBuiltinIds.get(gid) ?? [];
          list.push(pageId);
          groupIdToBuiltinIds.set(gid, list);
        }

        for (const [gid, ids] of groupIdToBuiltinIds.entries()) {
          const g = groupsWithBuiltin.find((it) => it.id === gid);
          if (!g) continue;
          g.pageIds = uniq([...(g.pageIds || []), ...ids]);
        }
      }
    }

    // 按照 groups 中的 pageIds 顺序排序
    const pageIdsForSort = Array.from(new Set(groupsWithBuiltin.flatMap((it) => it.pageIds)));
    const sortedPages = allPages.sort((a, b) => {
      const aIndex = pageIdsForSort.indexOf(a.id);
      const bIndex = pageIdsForSort.indexOf(b.id);
      // 如果某个页面不在 pageIds 中，放到最后
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return {
      pages: sortedPages,
      groups: groupsWithBuiltin.map((it) => pick(it, ['id', 'displayName', 'pageIds', 'isBuiltIn', 'iconUrl', 'sortIndex'])),
    };
  }

  public async getSimplePinnedPages(
    teamId: string,
    filter?: {
      routeSidebarFilter?: string;
      routeSidebarReserve?: string;
    },
  ) {
    const rawData = await this.getPinnedPages(teamId);

    const VINES_VIEW_ID_MAPPER: Record<string, string> = {
      'view-flow': 'process',
      'view-logs': 'log',
      'view-form': 'preview',
      'view-chat': 'chat',
    };

    const VINES_IFRAME_PAGE_TYPE2ID_MAPPER = Object.entries(VINES_VIEW_ID_MAPPER).reduce(
      (acc, [key, value]) => {
        acc[value] = key;
        return acc;
      },
      {} as Record<string, string>,
    );

    const newPages = rawData.pages.map((rawPage) => {
      const page = rawPage as {
        id: string;
        type: string;
        displayName: string;
        workflow?: {
          displayName: string;
          description: string;
          id: string;
          iconUrl: string;
        };
      };
      return {
        id: page.id,
        displayName: page.workflow ? page.workflow.displayName : page.displayName,
        description: page.workflow ? page.workflow.description : '',
        iconUrl: page.workflow ? page.workflow.iconUrl : '',
        workflowId: page.workflow ? page.workflow.id : undefined,
        type: page.type,
      };
    });

    const pageIdsForSort = Array.from(new Set(rawData.groups.flatMap((it) => it.pageIds)));

    const sidebarFilter = (filter?.routeSidebarFilter?.toString() ?? '')?.split(',')?.filter(Boolean);
    if (sidebarFilter.length > 0) {
      return {
        groups: rawData.groups,
        pages: (newPages.filter(({ type }) => sidebarFilter.includes(VINES_IFRAME_PAGE_TYPE2ID_MAPPER[type] || type)) ?? []).sort((a, b) => {
          const aIndex = pageIdsForSort.indexOf(a.id);
          const bIndex = pageIdsForSort.indexOf(b.id);
          return aIndex - bIndex;
        }),
      };
    }

    const sidebarReserve = (filter?.routeSidebarReserve?.toString() ?? '')?.split(',')?.filter(Boolean);
    if (sidebarReserve.length > 0) {
      return {
        groups: rawData.groups,
        pages: (newPages.filter(({ type }) => sidebarReserve.includes(VINES_IFRAME_PAGE_TYPE2ID_MAPPER[type] || type)) ?? []).sort((a, b) => {
          const aIndex = pageIdsForSort.indexOf(a.id);
          const bIndex = pageIdsForSort.indexOf(b.id);
          return aIndex - bIndex;
        }),
      };
    }

    return {
      groups: rawData.groups,
      pages: newPages,
    };
  }

  async updatePagePinStatus(teamId: string, pageId: string, pin: boolean) {
    return await this.workflowRepository.updatePagePinStatus(teamId, pageId, pin);
  }

  async createPageGroup(teamId: string, displayName: string, iconUrl?: string, pageId?: string) {
    const teamGroups = await this.pageGroupRepository.find({
      where: {
        teamId,
      },
    });

    const pageGroup: WorkflowPageGroupEntity = {
      id: generateDbId(),
      displayName,
      isBuiltIn: false,
      teamId,
      pageIds: pageId ? [pageId] : [],
      iconUrl,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
    await this.pageGroupRepository.save(pageGroup);

    if (pageId) {
      await this.syncBuiltinPinnedPreviewForTeamByPageIds(teamId, [pageId]);
    }

    return [...teamGroups, pageGroup];
  }

  async updatePageGroupSort(teamId: string, groupIds: string[]) {
    const groups = await this.pageGroupRepository.find({
      where: {
        teamId,
      },
    });
    const groupMap = keyBy(groups, 'id');
    for (const groupId of groupIds) {
      const group = groupMap[groupId];
      if (group) {
        group.sortIndex = groupIds.indexOf(groupId);
      }
    }
    await this.pageGroupRepository.save(groups);
    return groups;
  }

  async removePageGroup(teamId: string, groupId: string) {
    const group = await this.pageGroupRepository.findOne({
      where: {
        id: groupId,
        teamId,
      },
    });
    await this.pageGroupRepository.delete({
      id: groupId,
      teamId,
    });
    if (group?.pageIds?.length) {
      await this.syncBuiltinPinnedPreviewForTeamByPageIds(teamId, group.pageIds);
    }
    return await this.pageGroupRepository.find({
      where: {
        teamId,
      },
    });
  }

  async updatePageGroup(teamId: string, groupId: string, body: UpdatePageGroupDto) {
    const { displayName, pageId, pageIds, mode, iconUrl } = body;

    const values: Partial<WorkflowPageGroupEntity> = {
      ...(displayName && { displayName }),
      ...(iconUrl && { iconUrl }),
    };

    const groups = await this.pageGroupRepository.find({
      where: {
        teamId,
      },
    });

    // 保存原始 pageIds，用于之后做同步（rename/delete/add/remove 都会影响分组映射）
    let originPageIds: string[] = [];
    const originGroupDirect = groups.find((g) => g.id === groupId);
    if (originGroupDirect?.pageIds) {
      originPageIds = uniq(originGroupDirect.pageIds);
    }

    if (groupId === 'default') {
      const defaultGroup = groups.find((group) => group.isBuiltIn);

      if (defaultGroup) {
        groupId = defaultGroup.id;
      } else {
        const newDefaultGroup: WorkflowPageGroupEntity = {
          id: generateDbId(),
          displayName: JSON.stringify({
            'zh-CN': '默认',
            'en-US': 'Default',
          }),
          isBuiltIn: true,
          teamId,
          pageIds: [],
          createdTimestamp: Date.now(),
          updatedTimestamp: Date.now(),
        };
        await this.pageGroupRepository.save(newDefaultGroup);

        groupId = newDefaultGroup.id;
        groups.push(newDefaultGroup);
      }
    }

    const currentGroup = groups.find((group) => group.id === groupId);
    if (!currentGroup) {
      return { groups, message: 'Group not found' };
    }

    if (displayName) {
      set(currentGroup, 'displayName', displayName);
    }

    if (pageId && ['add', 'remove'].includes(mode)) {
      switch (mode) {
        case 'add':
          values.pageIds = uniq([...currentGroup.pageIds, pageId]);
          break;
        case 'remove':
          values.pageIds = uniq(currentGroup.pageIds.filter((id) => id !== pageId));
          break;
      }
      set(currentGroup, 'pageIds', values.pageIds);
    }

    if (pageIds && mode === 'set') {
      values.pageIds = uniq(pageIds);
    }

    const result = await this.pageGroupRepository.update(
      {
        id: groupId,
      },
      values,
    );

    // 同步：作者团队修改表单视图固定分组后，立即更新 builtin pinned 配置
    const affectedPageIds = uniq([
      ...originPageIds,
      ...(Array.isArray(values.pageIds) ? (values.pageIds as string[]) : []),
      ...(pageId ? [pageId] : []),
    ]);
    if (affectedPageIds.length > 0) {
      await this.syncBuiltinPinnedPreviewForTeamByPageIds(teamId, affectedPageIds);
    }

    return { groups, message: result ? 'Group updated' : 'Group update failed' };
  }

  async getPageGroups(teamId: string) {
    return await this.pageGroupRepository.find({
      where: {
        teamId,
      },
      order: {
        sortIndex: 1,
      },
    });
  }

  async updatePageGroupPageSort(teamId: string, groupId: string, pageIds: string[]) {
    const group = await this.pageGroupRepository.findOne({
      where: {
        id: groupId,
        teamId,
      },
    });
    if (!group) throw new NotFoundException('Group not found');

    group.pageIds = pageIds;
    await this.pageGroupRepository.save(group);
    return group;
  }

  /**
   * 根据预置应用 id 获取工作台页面分组
   * @description 当分组不存在则新建
   * @param teamId 团队 id
   * @param presetId 预置应用 id
   * @returns 工作台页面分组
   */
  async getPageGroupByPresetId(teamId: string, presetId: string) {
    const pageGroup = await this.pageGroupRepository.findOne({
      where: {
        teamId,
        presetRelationId: presetId,
      },
    });
    if (!pageGroup) {
      const presetAppSortGroup = marketplaceDataManager.presetAppSort.find((it) => it.id === presetId);
      if (!presetAppSortGroup) {
        throw new NotFoundException('Preset app sort group not found');
      }
      const newGroup = (await this.createPageGroup(teamId, JSON.stringify(presetAppSortGroup.displayName), presetAppSortGroup.iconUrl)).pop();
      await this.pageGroupRepository.update(newGroup.id, {
        presetRelationId: presetId,
      });
      // 关键：把 presetRelationId 回填到返回对象上，避免调用方在同一请求内重复创建
      (newGroup as any).presetRelationId = presetId;
      return newGroup;
    }
    return pageGroup;
  }

  public async clearTeamPageGroupsAndPinnedPages(teamId: string) {
    // 1. 清空所有 page groups
    await this.pageGroupRepository.delete({
      teamId,
    });

    // 2. 取消所有页面的 pinned 状态
    await this.pageRepository.update(
      {
        teamId,
        isDeleted: false,
      },
      {
        pinned: false,
        updatedTimestamp: Date.now(),
      },
    );
  }
}
