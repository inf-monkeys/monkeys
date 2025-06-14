import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { BUILT_IN_PAGE_INSTANCES } from '@/database/repositories/workflow.repository';
import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { isArray } from 'lodash';
import { CreatePageDto } from './dto/req/create-page.dto';
import { UpdatePageGroupDto, UpdatePagesDto } from './dto/req/update-pages.dto';
import { WorkflowPageService } from './workflow.page.service';

@ApiTags('Workflows/Pages')
@Controller('/workflow')
export class WorkflowPageController {
  constructor(private readonly pageService: WorkflowPageService) {}

  @ApiOperation({
    summary: '获取工作流下的所有视图（根据 sortIndex 从小到大排序），返回视图列表',
    description: '获取工作流下的所有视图（根据 sortIndex 从小到大排序），返回视图列表',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Get('/:workflowId/pages')
  async listWorkflowPages(@Param('workflowId') workflowId: string) {
    const data = await this.pageService.listWorkflowPages(workflowId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '在工作流下创建视图，返回新的视图列表',
    description: '在工作流下创建视图，返回新的视图列表',
  })
  @UseGuards(CompatibleAuthGuard)
  @Post('/:workflowId/pages')
  async createWorkflowPage(@Param('workflowId') workflowId: string, @Req() request: IRequest, @Body() body: CreatePageDto) {
    const { teamId, userId } = request;
    const data = await this.pageService.createWorkflowPage(workflowId, teamId, userId, body);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '批量修改视图，可以用来更新 sortIndex，返回新的视图列表',
    description: '批量修改视图，可以用来更新 sortIndex，返回新的视图列表',
  })
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Put('/:workflowId/pages')
  async updateWorkflowPages(@Param('workflowId') workflowId: string, @Req() request: IRequest, @Body() body: UpdatePagesDto) {
    const { teamId, userId } = request;
    const data = await this.pageService.updateWorkflowPages(workflowId, teamId, userId, body);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '获取视图类型定义',
    description: '获取视图类型定义',
  })
  @Get('/pages/types')
  async listPageTypes() {
    return new SuccessResponse({ data: BUILT_IN_PAGE_INSTANCES });
  }

  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Get('/pages/pinned')
  async getPinnedPages(@Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.pageService.getPinnedPages(teamId);
    return new SuccessResponse({ data });
  }

  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  @Get('/pages/pinned/simple')
  async getSimplePinnedPages(@Req() request: IRequest, @Query('sidebarFilter') sidebarFilter?: string, @Query('sidebarReserve') sidebarReserve?: string) {
    const { teamId } = request;
    const data = await this.pageService.getSimplePinnedPages(teamId, {
      routeSidebarFilter: sidebarFilter,
      routeSidebarReserve: sidebarReserve,
    });
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '获取工作流视图详情',
    description: '获取工作流视图详情，无需鉴权',
  })
  @Get('/pages/:pageId')
  async getWorkflowPageByPageId(@Param('pageId') pageId: string) {
    const data = await this.pageService.getWorkflowPageByPageId(pageId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '删除视图，返回新的视图列表',
    description: '删除视图，返回新的视图列表',
  })
  @UseGuards(CompatibleAuthGuard)
  @Delete('/:workflowId/pages/:pageId')
  async removeWorkflowPage(@Param('workflowId') workflowId: string, @Param('pageId') pageId: string, @Req() request: IRequest) {
    const { teamId, userId } = request;
    const data = await this.pageService.removeWorkflowPage(workflowId, teamId, userId, pageId);
    return new SuccessResponse({ data });
  }

  /**
   * 钉/取消钉某个 page
   * @param pageId
   * @param request
   * @param pin
   * @returns
   */
  @ApiOperation({
    summary: '固定某个视图到工作台',
    description: '将某个视图固定到工作台',
  })
  @Post('/pages/:pageId/pin')
  @UseGuards(CompatibleAuthGuard)
  async updatePagePinStatus(@Param('pageId') pageId: string, @Req() request: IRequest, @Body('pin') pin: boolean) {
    if (typeof pin !== 'boolean') {
      throw new BadRequestException('pin must be a boolean');
    }
    const { teamId } = request;
    const data = await this.pageService.updatePagePinStatus(teamId, pageId, pin);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '获取视图分组列表',
    description: '获取视图分组列表',
  })
  @Get('/page-groups')
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  async getPageGroups(@Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.pageService.getPageGroups(teamId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '创建视图分组',
    description: '创建视图分组',
  })
  @Post('/page-groups')
  @UseGuards(CompatibleAuthGuard)
  async createPageGroup(@Req() request: IRequest, @Body('displayName') displayName: string, @Body('iconUrl') iconUrl?: string, @Body('pageId') pageId?: string) {
    const { teamId } = request;
    const data = await this.pageService.createPageGroup(teamId, displayName, iconUrl, pageId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '更新视图分组排序',
    description: '更新视图分组排序',
  })
  @Put('/page-groups/sort')
  @UseGuards(CompatibleAuthGuard)
  async updatePageGroupSort(@Req() request: IRequest, @Body('groupIds') groupIds: string[]) {
    const { teamId } = request;
    if (!isArray(groupIds)) throw new BadRequestException('groupIds should be array');
    const data = await this.pageService.updatePageGroupSort(teamId, groupIds.filter(Boolean));
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '删除视图分组',
    description: '删除视图分组',
  })
  @Delete('/page-groups/:groupId')
  @UseGuards(CompatibleAuthGuard)
  async removePageGroup(@Req() request: IRequest, @Param('groupId') groupId: string) {
    const { teamId } = request;
    const data = await this.pageService.removePageGroup(teamId, groupId);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    summary: '更新视图分组',
    description: '更新视图分组',
  })
  @Put('/page-groups/:groupId')
  @UseGuards(CompatibleAuthGuard)
  async updatePageGroup(@Req() request: IRequest, @Param('groupId') groupId: string, @Body() body: UpdatePageGroupDto) {
    const { teamId } = request;
    const { groups, message } = await this.pageService.updatePageGroup(teamId, groupId, body);
    return new SuccessResponse({ data: groups, message });
  }

  @ApiOperation({
    summary: '更新视图分组页面排序',
    description: '更新视图分组页面排序',
  })
  @Put('/page-groups/:groupId/sort')
  @UseGuards(CompatibleAuthGuard)
  async updatePageGroupPageSort(@Req() request: IRequest, @Param('groupId') groupId: string, @Body('pageIds') pageIds: string[]) {
    const { teamId } = request;
    if (!isArray(pageIds)) throw new BadRequestException('pageIds should be array');
    const data = await this.pageService.updatePageGroupPageSort(teamId, groupId, pageIds.filter(Boolean));
    return new SuccessResponse({ data });
  }
}
