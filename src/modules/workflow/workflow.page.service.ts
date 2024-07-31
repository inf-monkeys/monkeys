import { generateDbId } from '@/common/utils';
import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { BUILT_IN_PAGE_INSTANCES, WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { keyBy, partition, pick, pickBy, set, uniq } from 'lodash';
import { In, Repository } from 'typeorm';
import { CreatePageDto } from './dto/req/create-page.dto';
import { UpdatePageGroupDto, UpdatePagesDto } from './dto/req/update-pages.dto';
import { WorkflowPageJson } from './interfaces';
import { WorkflowPageGroupEntity } from '@/database/entities/workflow/workflow-page-group';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';

@Injectable()
export class WorkflowPageService {
  constructor(
    @InjectRepository(WorkflowPageEntity)
    private readonly pageRepository: Repository<WorkflowPageEntity>,
    @InjectRepository(WorkflowPageGroupEntity)
    private readonly pageGroupRepository: Repository<WorkflowPageGroupEntity>,
    @InjectRepository(ConversationAppEntity)
    private readonly conversationAppRepository: Repository<ConversationAppEntity>,
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

  async importWorkflowPage(workflowId: string, teamId: string, userId: string, pages: WorkflowPageJson[]) {
    for (const { displayName, sortIndex, pinned, type, isBuiltIn, permissions } of pages) {
      const pageId = generateDbId();
      const page: WorkflowPageEntity = {
        id: pageId,
        type: type,
        displayName,
        workflowId,
        isBuiltIn: isBuiltIn,
        teamId,
        permissions,
        customOptions: {},
        sortIndex: sortIndex,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
        isDeleted: false,
        pinned: pinned,
      };
      await this.pageRepository.save(page);
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

  public async getPinnedPages(teamId: string) {
    const groups = await this.pageGroupRepository.find({
      where: {
        teamId,
      },
    });

    const pageIds = uniq(groups.map((it) => it.pageIds).flat(1)) as string[];

    const [agentPageIds, normalPageIds] = partition(pageIds, (id) => id.startsWith('agent-'));

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

    // agent page
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

    return {
      pages: [
        ...filteredPages.map((p) => ({
          ...p,
          workflow: workflowMap[p.workflowId],
          instance: pageInstanceTypeMapper[p.type],
        })),
        ...agentPages,
      ],
      groups: groups.map((it) => pick(it, ['id', 'displayName', 'pageIds', 'isBuiltIn'])),
    };
  }

  async updatePagePinStatus(teamId: string, pageId: string, pin: boolean) {
    return await this.workflowRepository.updatePagePinStatus(teamId, pageId, pin);
  }

  async createPageGroup(teamId: string, displayName: string, pageId?: string) {
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
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
    await this.pageGroupRepository.save(pageGroup);

    return [...teamGroups, pageGroup];
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
    const { displayName, pageId, mode } = body;

    const values: Partial<WorkflowPageGroupEntity> = {
      ...(displayName && { displayName }),
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
    });
  }
}
