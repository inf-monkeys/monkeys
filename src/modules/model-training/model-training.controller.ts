import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { ModelTrainingEntity } from '@/database/entities/model-training/model-training';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateModelTrainingDto } from './dto/create-model-training.dto';
import { UpdateModelTrainingDto } from './dto/update-model-training.dto';
import { ModelTrainingService } from './model-training.service';

@Controller('model-training')
@ApiTags('Model Training')
@UseGuards(CompatibleAuthGuard)
export class ModelTrainingController {
  constructor(private readonly modelTrainingService: ModelTrainingService) {}

  @Post('')
  @ApiOperation({
    summary: '创建模型训练',
    description: '创建模型训练',
  })
  async createProject(@Req() req: IRequest, @Body() createModelTrainingDto: CreateModelTrainingDto) {
    const { teamId } = req;
    const result = await this.modelTrainingService.create({
      ...createModelTrainingDto,
      teamId,
    });
    return new SuccessResponse({ data: result });
  }

  @Get('')
  @ApiOperation({
    summary: '获取团队模型训练列表',
    description: '获取团队模型训练列表',
  })
  async findAllProjects(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { page, limit } = dto;
    const { totalCount, list } = await this.modelTrainingService.findAllByTeamId(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Get(':modelTrainingId')
  @ApiOperation({
    summary: '获取模型训练',
    description: '获取模型训练',
  })
  async findOneProject(@Param('modelTrainingId') modelTrainingId: string) {
    const project = await this.modelTrainingService.findById(modelTrainingId);
    if (!project) {
      throw new NotFoundException('模型训练不存在');
    }
    return new SuccessResponse({ data: project });
  }

  @Put(':modelTrainingId')
  @ApiOperation({
    summary: '更新模型训练',
    description: '更新模型训练',
  })
  async updateProject(@Param('modelTrainingId') modelTrainingId: string, @Body() updateModelTrainingDto: UpdateModelTrainingDto) {
    const project = await this.modelTrainingService.findById(modelTrainingId);
    if (!project) {
      throw new NotFoundException('模型训练不存在');
    }
    const updatedProject = new ModelTrainingEntity();
    Object.assign(updatedProject, {
      ...project,
      ...updateModelTrainingDto,
    });
    const result = await this.modelTrainingService.update(modelTrainingId, updatedProject);
    return new SuccessResponse({ data: result });
  }

  @Delete(':modelTrainingId')
  @ApiOperation({
    summary: '删除模型训练',
    description: '删除模型训练',
  })
  async removeProject(@Param('modelTrainingId') modelTrainingId: string) {
    const project = await this.modelTrainingService.findById(modelTrainingId);
    if (!project) {
      throw new NotFoundException('模型训练不存在');
    }
    const result = await this.modelTrainingService.delete(modelTrainingId);
    return new SuccessResponse({ data: result });
  }
}
