import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';
import { CreateDesignMetadataDto } from './dto/create-design-metadata.dto';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';
import { UpdateDesignMetadataDto } from './dto/update-design-metadata.dto';
import { UpdateDesignProjectDto } from './dto/update-design-project.dto';

@Controller('design')
@ApiTags('Design/CRUD')
@UseGuards(CompatibleAuthGuard)
export class DesignController {
  constructor(
    private readonly designMetadataService: DesignMetadataService,
    private readonly designProjectService: DesignProjectService,
  ) {}

  @Post('project')
  @ApiOperation({
    summary: '创建设计项目',
    description: '创建设计项目',
  })
  async createProject(@Req() req: IRequest, @Body() createDesignProjectDto: CreateDesignProjectDto) {
    const { teamId, userId } = req;
    const result = await this.designProjectService.create({
      ...createDesignProjectDto,
      teamId,
      creatorUserId: userId,
    });
    return new SuccessResponse({ data: result });
  }

  @Get('project')
  @ApiOperation({
    summary: '获取团队设计项目列表',
    description: '获取团队设计项目列表',
  })
  async findAllProjects(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { page, limit } = dto;
    const { totalCount, list } = await this.designProjectService.findByTeamId(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: '获取设计项目',
    description: '获取设计项目',
  })
  async findOneProject(@Param('projectId') projectId: string) {
    const project = await this.designProjectService.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    return new SuccessResponse({ data: project });
  }

  @Patch('project/:projectId')
  @ApiOperation({
    summary: '更新设计项目',
    description: '更新设计项目',
  })
  async updateProject(@Param('projectId') projectId: string, @Body() updateDesignProjectDto: UpdateDesignProjectDto) {
    const project = await this.designProjectService.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    const updatedProject = new DesignProjectEntity();
    Object.assign(updatedProject, {
      ...project,
      ...updateDesignProjectDto,
    });
    const result = await this.designProjectService.update(projectId, updatedProject);
    return new SuccessResponse({ data: result });
  }

  @Delete('project/:projectId')
  @ApiOperation({
    summary: '删除设计项目',
    description: '删除设计项目',
  })
  async removeProject(@Param('projectId') projectId: string) {
    const project = await this.designProjectService.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    // will delete all related metadata
    const result = await this.designProjectService.delete(projectId);
    return new SuccessResponse({ data: result });
  }

  @Post('project/:projectId/metadata')
  @ApiOperation({
    summary: '创建设计画板',
    description: '创建设计画板',
  })
  async createDesignMetadata(@Req() req: IRequest, @Body() createDesignMetadataDto: CreateDesignMetadataDto) {
    const { teamId } = req;
    const designProject = await this.designProjectService.findById(createDesignMetadataDto.designProjectId);
    if (!designProject) {
      throw new NotFoundException('设计项目不存在');
    }
    const result = await this.designMetadataService.create({
      ...createDesignMetadataDto,
      teamId,
    });
    return new SuccessResponse({ data: result });
  }

  @Get('project/:projectId/metadata/')
  @ApiOperation({
    summary: '获取设计',
    description: '获取设计',
  })
  async findAllDesignMetadataByProjectId(@Param('projectId') projectId: string) {
    const list = await this.designMetadataService.findAllByProjectId(projectId);
    if (!list) {
      throw new NotFoundException('设计画板不存在');
    }
    return new SuccessResponse({
      data: list,
    });
  }

  @Patch('metadata/:metadataId')
  @ApiOperation({
    summary: '更新设计',
  })
  async updateDesignMetadata(@Param('metadataId') metadataId: string, @Body() updateDesignMetadataDto: UpdateDesignMetadataDto) {
    const result = await this.designMetadataService.update(metadataId, updateDesignMetadataDto);
    return new SuccessResponse({ data: result });
  }

  @Delete('metadata/:metadataId')
  @ApiOperation({
    summary: '删除设计',
  })
  async deleteDesignMetadata(@Param('metadataId') metadataId: string) {
    const result = await this.designMetadataService.remove(metadataId);
    return new SuccessResponse({ data: result });
  }
}
