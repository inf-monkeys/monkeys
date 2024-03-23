import { PageInstance, WorkflowPageEntity } from '@/entities/workflow/workflow-page';
import { WorkflowRepository } from '@/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { keyBy, uniq } from 'lodash';
import { Repository } from 'typeorm';
import { CreatePageDto } from './dto/req/create-page.dto';
import { UpdatePagesDto } from './dto/req/update-pages.dto';
import { WorkflowPageJson } from './interfaces';

export const BUILT_IN_PAGE_INSTANCES: PageInstance[] = [
  {
    name: '流程视图',
    type: 'process',
    allowedPermissions: ['read', 'write', 'exec', 'permission'],
    icon: '🚀',
  },
  {
    name: '日志视图',
    type: 'log',
    allowedPermissions: ['read', 'write'],
    icon: '📃',
  },
  {
    name: '预览视图',
    type: 'preview',
    allowedPermissions: ['read', 'write', 'exec', 'permission'],
    icon: '📷',
  },
  {
    name: '对话视图',
    type: 'chat',
    allowedPermissions: ['read', 'write', 'exec', 'permission'],
    icon: '💬',
  },
];

@Injectable()
export class WorkflowPageService {
  constructor(
    @InjectRepository(WorkflowPageEntity)
    private readonly pageRepository: Repository<WorkflowPageEntity>,
    private readonly workflowRepository: WorkflowRepository,
  ) {}

  async listWorkflowPages(workflowId: string, teamId?: string) {
    let pages: WorkflowPageEntity[] = [];
    const existsPages = await this.pageRepository.find({
      where: {
        teamId,
        workflowId,
        isDeleted: false,
      },
      order: {
        sortIndex: 1,
      },
    });
    if (existsPages.length > 0) {
      pages = existsPages;
    } else {
      let sortIndex = 0;
      pages = BUILT_IN_PAGE_INSTANCES.map((item) => ({
        id: new ObjectId(),
        type: item.type,
        displayName: item.name,
        workflowId,
        isBuiltIn: true,
        teamId,
        permissions: item.allowedPermissions, // 默认授予全部权限
        sortIndex: ++sortIndex,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
        isDeleted: false,
      }));
      await this.pageRepository.save(pages);
    }
    const pageInstanceTypeMapper = keyBy(BUILT_IN_PAGE_INSTANCES, 'type');
    return pages.map((page) => ({
      ...page,
      instance: pageInstanceTypeMapper[page.type],
    }));
  }

  async listWorkflowPagesBrief(workflowId: string, teamId?: string): Promise<WorkflowPageJson[]> {
    const pages = await this.listWorkflowPages(workflowId, teamId);
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
      const pageId = new ObjectId();
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
    const pageId = new ObjectId();
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
    return this.listWorkflowPages(workflowId, teamId);
  }

  async updateWorkflowPages(workflowId: string, teamId: string, userId: string, body: UpdatePagesDto) {
    // const bulk = this.pageRepository.initializeUnorderedBulkOp();
    // const { pages: pagesUpdates } = body;
    // for (const update of pagesUpdates) {
    //   const { pageId, permissions, displayName, sortIndex, customOptions } = update ?? {};
    //   if (!pageId) continue;
    //   bulk
    //     .find({
    //       _id: new ObjectId(pageId),
    //       teamId,
    //       workflowId,
    //     })
    //     .updateOne({
    //       $set: {
    //         ...pickBy({ permissions, displayName, sortIndex, customOptions }, (v) => typeof v !== 'undefined'),
    //         updatedTimestamp: Date.now(),
    //       },
    //     });
    // }
    // if (pagesUpdates.length) {
    //   await bulk.execute();
    // }
    // return this.listWorkflowPages(workflowId, teamId, userId);
  }

  async removeWorkflowPage(workflowId: string, teamId: string, userId: string, pageId: string) {
    await this.pageRepository.update(
      {
        id: new ObjectId(pageId),
        teamId,
        workflowId,
      },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      },
    );
    return this.listWorkflowPages(workflowId, teamId);
  }

  async getWorkflowPageByPageId(pageId: string) {
    const page = await this.pageRepository.findOne({
      where: {
        id: new ObjectId(pageId),
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
    const pages = await this.pageRepository.find({
      where: {
        teamId,
        pinned: true,
        isDeleted: false,
      },
    });
    const workflowIds = uniq(pages.map((page) => page.workflowId));
    const workflows = await this.workflowRepository.findWorkflowByIds(workflowIds);
    const workflowMap = keyBy(workflows, 'workflowId');
    return pages.map((p) => ({
      ...p,
      workflow: workflowMap[p.workflowId],
    }));
  }

  async pinPage(teamId: string, _: string, pageId: string, pin: boolean) {
    const page = await this.pageRepository.findOne({
      where: {
        id: new ObjectId(pageId),
        teamId,
        isDeleted: false,
      },
    });
    if (!page) {
      throw new Error('page not exists');
    }
    await this.pageRepository.update(
      {
        id: page.id,
      },
      {
        pinned: pin,
      },
    );
  }
}
