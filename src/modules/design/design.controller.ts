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
    return await this.designProjectService.createDesignProject(project);
  }

  @Get('project')
  @ApiOperation({
    summary: '获取设计项目列表',
    description: '获取设计项目列表',
  })
  async findAllProjects(@Req() req: IRequest) {
    const { teamId } = req;
    return await this.designProjectService.findDesignProjectByTeamId(teamId);
  }

  @Get('project/:id')
  @ApiOperation({
    summary: '获取设计项目',
    description: '获取设计项目',
  })
  async findOneProject(@Param('id') id: string) {
    const project = await this.designProjectService.findDesignProjectById(id);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    return project;
  }

  @Patch('project/:id')
  @ApiOperation({
    summary: '更新设计项目',
    description: '更新设计项目',
  })
  async updateProject(@Param('id') id: string, @Body() updateDesignProjectDto: UpdateDesignProjectDto) {
    const project = await this.designProjectService.findDesignProjectById(id);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    const updatedProject = new DesignProjectEntity();
    Object.assign(updatedProject, {
      ...project,
      ...updateDesignProjectDto,
    });
    return await this.designProjectService.updateDesignProject(id, updatedProject);
  }

  @Delete('project/:id')
  @ApiOperation({
    summary: '删除设计项目',
    description: '删除设计项目',
  })
  async removeProject(@Param('id') id: string) {
    const project = await this.designProjectService.findDesignProjectById(id);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }
    return await this.designProjectService.deleteDesignProject(id);
  }

  @Post()
  @ApiOperation({
    summary: '创建设计画板',
    description: '创建设计画板',
  })
  async createDesignMetadata(@Req() req: IRequest, @Body() createDesignMetadataDto: CreateDesignMetadataDto) {
    const { teamId } = req;
    const designProject = await this.designProjectService.findDesignProjectById(createDesignMetadataDto.designProjectId);
    if (!designProject) {
      throw new NotFoundException('设计项目不存在');
    }
    return await this.designMetadataService.create({
      ...createDesignMetadataDto,
      teamId,
    });
  }

  @Get()
  @ApiOperation({
    summary: '获取设计列表',
    description: '获取设计列表',
  })
  async findAll(@Req() req: IRequest) {
    const { teamId } = req;
    return await this.designMetadataService.findAllbyTeamId(teamId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取设计',
    description: '获取设计',
  })
  async findOne(@Param('id') id: string) {
    const metadata = await this.designMetadataService.findByProjectId(id);
    if (!metadata) {
      throw new NotFoundException('设计画板不存在');
    }
    return metadata;
  }

  @Patch(':id')
  @ApiOperation({
    summary: '更新设计',
  })
  async update(@Param('id') id: string, @Body() updateDesignMetadataDto: UpdateDesignMetadataDto) {
    return await this.designMetadataService.update(id, updateDesignMetadataDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除设计',
  })
  async remove(@Param('id') id: string) {
    return await this.designMetadataService.remove(id);
  }
}
