import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { generateDbId } from '@/common/utils';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DesignMetadataService } from './design.metadata.service';
import { DesignProjectService } from './design.project.service';
import { CreateDesignMetadataDto } from './dto/create-design-metadata.dto';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';
import { UpdateDesignMetadataDto } from './dto/update-design-metadata.dto';
import { UpdateDesignProjectDto } from './dto/update-design-project.dto';

@Controller('design')
@ApiTags('DesignCRUD')
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
    const { teamId } = req;
    const id = generateDbId();
    const project = new DesignProjectEntity();
    Object.assign(project, {
      ...createDesignProjectDto,
      id,
      teamId,
    });
    return await this.designProjectService.create(project);
  }

  @Get('project')
  @ApiOperation({
    summary: '获取设计项目列表',
    description: '获取设计项目列表',
  })
  async findAllProjects(@Req() req: IRequest) {
    const { teamId } = req;
    return await this.designProjectService.findByTeamId(teamId);
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
    return project;
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
    return await this.designProjectService.update(projectId, updatedProject);
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
    return await this.designProjectService.delete(projectId);
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
    return await this.designMetadataService.create({
      ...createDesignMetadataDto,
      teamId,
    });
  }

  @Get('project/:projectId/metadata')
  @ApiOperation({
    summary: '获取设计列表',
    description: '获取设计列表',
  })
  async findAllbyTeamId(@Req() req: IRequest) {
    const { teamId } = req;
    return await this.designMetadataService.findAllbyTeamId(teamId);
  }

  @Get('metadata/:metadataId')
  @ApiOperation({
    summary: '获取设计',
    description: '获取设计',
  })
  async findOneById(@Param('metadataId') metadataId: string) {
    return await this.designMetadataService.findById(metadataId);
  }

  @Get('project/:projectId/metadata/')
  @ApiOperation({
    summary: '获取设计',
    description: '获取设计',
  })
  async findAllByProjectId(@Param('projectId') projectId: string) {
    const metadata = await this.designMetadataService.findAllByProjectId(projectId);
    if (!metadata) {
      throw new NotFoundException('设计画板不存在');
    }
    return metadata;
  }

  @Patch('metadata/:metadataId')
  @ApiOperation({
    summary: '更新设计',
  })
  async update(@Param('metadataId') metadataId: string, @Body() updateDesignMetadataDto: UpdateDesignMetadataDto) {
    return await this.designMetadataService.update(metadataId, updateDesignMetadataDto);
  }

  @Delete('metadata/:metadataId')
  @ApiOperation({
    summary: '删除设计',
  })
  async remove(@Param('metadataId') metadataId: string) {
    return await this.designMetadataService.remove(metadataId);
  }
}
