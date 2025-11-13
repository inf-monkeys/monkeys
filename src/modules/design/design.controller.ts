import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { DesignAssociationEntity } from '@/database/entities/design/design-association';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DesignAssociationService } from './design.association.service';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';
import { CreateDesignAssociationDto } from './dto/create-design-association.dto';
import { CreateDesignMetadataDto } from './dto/create-design-metadata.dto';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';
import { GenerateThumbnailDto } from './dto/generate-thumbnail.dto';
import { UpdateDesignAssociationDto } from './dto/update-design-association.dto';
import { UpdateDesignMetadataDto } from './dto/update-design-metadata.dto';
import { UpdateDesignProjectDto } from './dto/update-design-project.dto';
import { CreateDesignProjectVersionDto } from './dto/create-design-project-version.dto';

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
    // 如果创建的是模板，检查是否为团队所有者
    if (createDesignProjectDto.isTemplate) {
      const isOwner = await this.designProjectService.checkIsTeamOwner(teamId, userId);
      if (!isOwner) {
        throw new ForbiddenException('只有团队所有者才能创建设计模板');
      }
    }
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
  async updateProject(@Req() req: IRequest, @Param('projectId') projectId: string, @Body() updateDesignProjectDto: UpdateDesignProjectDto) {
    const { userId } = req;
    const project = await this.designProjectService.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    // 如果项目是模板，检查权限
    await this.designProjectService.checkTemplatePermission(project, userId);
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
  async removeProject(@Req() req: IRequest, @Param('projectId') projectId: string) {
    const { userId } = req;
    const project = await this.designProjectService.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    // 如果项目是模板，检查权限
    await this.designProjectService.checkTemplatePermission(project, userId);
    // will delete all related metadata
    const result = await this.designProjectService.delete(projectId);
    return new SuccessResponse({ data: result });
  }

  @Post('project/:projectId/fork')
  @ApiOperation({
    summary: 'Fork 设计模板',
    description: '复制设计模板及其所有画板到新的设计项目',
  })
  async forkTemplate(@Req() req: IRequest, @Param('projectId') projectId: string) {
    const { teamId, userId } = req;
    const result = await this.designProjectService.forkTemplate(projectId, teamId, userId);
    return new SuccessResponse({ data: result });
  }

  @Post('project/:projectId/metadata')
  @ApiOperation({
    summary: '创建设计画板',
    description: '创建设计画板',
  })
  async createDesignMetadata(@Req() req: IRequest, @Param('projectId') projectId: string, @Body() createDesignMetadataDto: CreateDesignMetadataDto) {
    const { teamId, userId } = req;
    const designProject = await this.designProjectService.findById(projectId);
    if (!designProject) {
      throw new NotFoundException('设计项目不存在');
    }
    // 如果项目是模板，检查权限
    await this.designProjectService.checkTemplatePermission(designProject, userId);
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
  async updateDesignMetadata(@Req() req: IRequest, @Param('metadataId') metadataId: string, @Body() updateDesignMetadataDto: UpdateDesignMetadataDto) {
    const { userId } = req;
    const metadata = await this.designMetadataService.findByMetadataId(metadataId);
    if (!metadata) {
      throw new NotFoundException('设计画板不存在');
    }
    // 检查画板所属的项目是否为模板
    const designProject = await this.designProjectService.findById(metadata.designProjectId);
    if (designProject) {
      await this.designProjectService.checkTemplatePermission(designProject, userId);
    }
    const result = await this.designMetadataService.update(metadataId, updateDesignMetadataDto);
    return new SuccessResponse({ data: result });
  }

  @Delete('metadata/:metadataId')
  @ApiOperation({
    summary: '删除设计',
  })
  async deleteDesignMetadata(@Req() req: IRequest, @Param('metadataId') metadataId: string) {
    const { userId } = req;
    const metadata = await this.designMetadataService.findByMetadataId(metadataId);
    if (!metadata) {
      throw new NotFoundException('设计画板不存在');
    }
    // 检查画板所属的项目是否为模板
    const designProject = await this.designProjectService.findById(metadata.designProjectId);
    if (designProject) {
      await this.designProjectService.checkTemplatePermission(designProject, userId);
    }
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

  @Post('metadata/:metadataId/generate-thumbnail')
  @ApiOperation({
    summary: '生成画板缩略图',
    description: '为指定画板生成缩略图',
  })
  async generateThumbnail(@Param('metadataId') metadataId: string, @Body() generateThumbnailDto: GenerateThumbnailDto) {
    await this.designMetadataService.generateThumbnail(metadataId, generateThumbnailDto.imageData);
    return new SuccessResponse({ data: { success: true } });
  }

  @Get('project/:projectId/export')
  @ApiOperation({
    summary: '导出设计项目',
    description: '导出设计项目及其所有画板的完整数据',
  })
  async exportProject(@Req() req: IRequest, @Param('projectId') projectId: string) {
    const { userId } = req;
    const exportData = await this.designProjectService.exportProject(projectId, userId);
    return new SuccessResponse({ data: exportData });
  }

  @Post('project/import')
  @ApiOperation({
    summary: '导入设计项目',
    description: '从JSON数据导入设计项目及其所有画板',
  })
  async importProject(@Req() req: IRequest, @Body() importData: any) {
    const { teamId, userId } = req;
    const result = await this.designProjectService.importProject(importData, teamId, userId);
    return new SuccessResponse({ data: result });
  }

  @Get('project/:projectId/versions')
  @ApiOperation({
    summary: '获取设计项目的所有版本',
    description: '获取设计项目的所有版本历史',
  })
  async getProjectVersions(@Param('projectId') projectId: string) {
    const versions = await this.designProjectService.getProjectVersions(projectId);
    return new SuccessResponse({ data: versions });
  }

  @Post('project/:projectId/versions')
  @ApiOperation({
    summary: '创建设计项目新版本',
    description: '基于当前版本创建新版本，会复制所有画板内容',
  })
  async createProjectVersion(
    @Req() req: IRequest,
    @Param('projectId') projectId: string,
    @Body() body: CreateDesignProjectVersionDto,
  ) {
    const { teamId, userId } = req;
    const result = await this.designProjectService.createProjectVersion(
      projectId,
      body.currentVersion,
      teamId,
      userId,
      {
        displayName: body.displayName,
        description: body.description,
        iconUrl: body.iconUrl,
      },
    );
    return new SuccessResponse({ data: result });
  }

  @Get('project/:projectId/version/:version')
  @ApiOperation({
    summary: '获取设计项目的指定版本',
    description: '根据 projectId 和版本号获取设计项目',
  })
  async getProjectByVersion(@Param('projectId') projectId: string, @Param('version') version: string) {
    const versionNum = parseInt(version, 10);
    const project = await this.designProjectService.findLatestByProjectId(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    const versionProject = await this.designProjectService.findById(project.id);
    return new SuccessResponse({ data: versionProject });
  }
}
