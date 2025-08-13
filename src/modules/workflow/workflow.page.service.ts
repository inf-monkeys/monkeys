import { generateDbId } from '@/common/utils';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';
import { DesignMetadataEntity } from '@/database/entities/design/design-metatdata';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { BUILT_IN_PAGE_INSTANCES, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty, keyBy, pick, pickBy, set, uniq } from 'lodash';
import { In, Repository } from 'typeorm';
import { presetAppSort } from '../marketplace/services/marketplace.data';
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
    @InjectRepository(ConversationAppEntity)
    private readonly conversationAppRepository: Repository<ConversationAppEntity>,
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
    const designBoardPageIds = pageIds.filter((id) => id && id.startsWith('design-board-'));
    const normalPageIds = pageIds.filter((id) => id && !designBoardPageIds.includes(id) && !agentPageIds.includes(id));
    return { agentPageIds, designBoardPageIds, normalPageIds };
  }

  public async getPinnedPages(teamId: string) {
    if (isEmpty(teamId)) {
      return { pages: [], groups: [] };
    }

    const groups = await this.pageGroupRepository.find({
      where: {
        teamId,
      },
      order: {
        sortIndex: 1,
      },
    });

    const pageIds = uniq(groups.map((it) => it.pageIds).flat(1)) as string[];

    const { agentPageIds, designBoardPageIds, normalPageIds } = this.splitPageIds(pageIds);

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
    const workflows = await this.workflowRepository.findWorkflowByIds(workflowIds);
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

    return {
      pages: [
        ...filteredPages.map((p) => ({
          ...p,
          workflow: workflowMap[p.workflowId],
          instance: pageInstanceTypeMapper[p.type],
        })),
        ...agentPages,
        ...designBoardPages,
      ],
      groups: groups.map((it) => pick(it, ['id', 'displayName', 'pageIds', 'isBuiltIn', 'iconUrl', 'sortIndex'])),
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
    await this.pageGroupRepository.delete({
      id: groupId,
      teamId,
    });
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

    if (groupId === 'default') {
      const defaultGroup = groups.find((group) => group.isBuiltIn);

      if (defaultGroup) {
        groupId = defaultGroup.id;
      } else {
        const newDefaultGroup: WorkflowPageGroupEntity = {
          id: generateDbId(),
          displayName: '默认分组',
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
      const presetAppSortGroup = presetAppSort.find((it) => it.id === presetId);
      if (!presetAppSortGroup) {
        throw new NotFoundException('Preset app sort group not found');
      }
      const newGroup = (await this.createPageGroup(teamId, JSON.stringify(presetAppSortGroup.displayName), presetAppSortGroup.iconUrl)).pop();
      await this.pageGroupRepository.update(newGroup.id, {
        presetRelationId: presetId,
      });
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
