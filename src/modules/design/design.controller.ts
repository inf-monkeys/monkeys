import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { DesignAssociationEntity } from '@/database/entities/design/design-association';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DesignAssociationService } from './design.association.service';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';
import { CreateDesignAssociationDto } from './dto/create-design-association.dto';
import { CreateDesignMetadataDto } from './dto/create-design-metadata.dto';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';
import { UpdateDesignAssociationDto } from './dto/update-design-association.dto';
import { UpdateDesignMetadataDto } from './dto/update-design-metadata.dto';
import { UpdateDesignProjectDto } from './dto/update-design-project.dto';

@Controller('design')
@ApiTags('Design/CRUD')
@UseGuards(CompatibleAuthGuard)
export class DesignController {
  constructor(
    private readonly designMetadataService: DesignMetadataService,
    private readonly designProjectService: DesignProjectService,
    private readonly designAssociationService: DesignAssociationService,
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

  @Put('project/:projectId')
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
  async createDesignMetadata(@Req() req: IRequest, @Param('projectId') projectId: string, @Body() createDesignMetadataDto: CreateDesignMetadataDto) {
    const { teamId } = req;
    const designProject = await this.designProjectService.findById(projectId);
    if (!designProject) {
      throw new NotFoundException('设计项目不存在');
    }
    const result = await this.designMetadataService.create(projectId, teamId, createDesignMetadataDto);
    return new SuccessResponse({ data: result });
  }

  @Get('project/:projectId/metadata/')
  @ApiOperation({
    summary: '获取设计画板列表',
    description: '获取设计画板列表',
  })
  async findAllDesignMetadataByProjectId(@Param('projectId') projectId: string) {
    const list = await this.designMetadataService.findAllByProjectIdWithourSnapshot(projectId);
    if (!list) {
      throw new NotFoundException('设计画板不存在');
    }
    return new SuccessResponse({
      data: list,
    });
  }

  @Get('metadata/:metadataId')
  @ApiOperation({
    summary: '获取设计画板元数据',
  })
  async getDesignMetadata(@Param('metadataId') metadataId: string) {
    const result = await this.designMetadataService.findByMetadataId(metadataId);
    return new SuccessResponse({ data: result });
  }

  @Put('metadata/:metadataId')
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

  @Post('association')
  @ApiOperation({
    summary: '创建设计关联',
    description: '创建设计关联',
  })
  async createDesignAssociation(@Req() req: IRequest, @Body() createDesignAssociationDto: CreateDesignAssociationDto) {
    const { teamId } = req;
    const result = await this.designAssociationService.create({
      ...createDesignAssociationDto,
      teamId,
    });
    return new SuccessResponse({ data: result });
  }

  @Get('association')
  @ApiOperation({
    summary: '获取设计关联列表',
    description: '获取设计关联列表',
  })
  async findAllDesignAssociations(@Req() req: IRequest) {
    const { teamId } = req;
    const list = await this.designAssociationService.findByTeamId(teamId);
    return new SuccessResponse({ data: list });
  }

  @Put('association/:associationId')
  @ApiOperation({
    summary: '更新设计关联',
    description: '更新设计关联',
  })
  async updateDesignAssociation(@Param('associationId') associationId: string, @Body() updateDesignAssociationDto: UpdateDesignAssociationDto) {
    const association = await this.designAssociationService.findById(associationId);
    if (!association) {
      throw new NotFoundException('设计关联不存在');
    }
    const updatedAssociation = new DesignAssociationEntity();
    Object.assign(updatedAssociation, {
      ...association,
      ...updateDesignAssociationDto,
    });
    const result = await this.designAssociationService.update(associationId, updatedAssociation);
    return new SuccessResponse({ data: result });
  }

  @Delete('association/:associationId')
  @ApiOperation({
    summary: '删除设计关联',
    description: '删除设计关联',
  })
  async deleteDesignAssociation(@Param('associationId') associationId: string) {
    const result = await this.designAssociationService.delete(associationId);
    return new SuccessResponse({ data: result });
  }

  @Get('association/:associationId')
  @ApiOperation({
    summary: '获取设计关联',
    description: '获取设计关联',
  })
  async getDesignAssociation(@Param('associationId') associationId: string) {
    const result = await this.designAssociationService.findById(associationId);
    return new SuccessResponse({ data: result });
  }
}
