import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { ModelTrainingEntity } from '@/database/entities/model-training/model-training';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateModelTrainingDto } from './dto/create-model-training.dto';
import { CreateTestTableUrlDto } from './dto/create-test-table-url.dto';
import { GetFeishuTableHeadersDto } from './dto/get-feishu-table-headers.dto';
import { GetFeishuTableUrlDto } from './dto/get-feishu-table-url.dto';
import { GetModelTestConfigDto } from './dto/get-model-test-config.dto';
import { GetTestTableConfigDto } from './dto/get-test-table-config.dto';
import { GetTrainingConfigDto } from './dto/get-training-config.dto';
import { SaveTrainingConfigDto } from './dto/save-training-config.dto';
import { StartModelTestDto } from './dto/start-model-test.dto';
import { SubmitDataUploadTaskDto } from './dto/submit-data-upload-task.dto';
import { UpdateModelTrainingDto } from './dto/update-model-training.dto';
import { UploadDataToTestTableDto } from './dto/upload-data-to-test-table.dto';
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

  @Post('start-training')
  @ApiOperation({
    summary: '开始模型训练',
    description: '根据模型训练ID开始训练任务',
  })
  async startTraining(@Body() dto: { model_training_id: string }) {
    const result = await this.modelTrainingService.startTraining(dto.model_training_id);
    return new SuccessResponse({ data: result });
  }

  @Post('stop-training')
  @ApiOperation({
    summary: '停止模型训练',
    description: '根据模型训练ID停止正在运行的训练任务',
  })
  async stopTraining(@Body() dto: { model_training_id: string }) {
    const result = await this.modelTrainingService.stopTraining(dto.model_training_id);
    return new SuccessResponse({ data: result });
  }

  @Get('upload-task-status/:id')
  @ApiOperation({
    summary: '获取数据上传任务状态',
    description: '根据模型训练ID获取数据上传任务状态',
  })
  async getUploadTaskStatus(@Param('id') id: string) {
    const result = await this.modelTrainingService.getUploadTaskStatus(id);
    return new SuccessResponse({ data: result });
  }

  @Get('training-status/:id')
  @ApiOperation({
    summary: '获取训练任务状态',
    description: '根据模型训练ID获取训练任务状态',
  })
  async getTrainingStatus(@Param('id') id: string) {
    const result = await this.modelTrainingService.getTrainingStatus(id);
    return new SuccessResponse({ data: result });
  }

  @Post('feishu-table-url')
  @ApiOperation({
    summary: '获取飞书表格链接',
    description: '根据模型训练ID获取飞书表格链接，如果数据库中没有则调用外部API获取',
  })
  async getFeishuTableUrl(@Body() getFeishuTableUrlDto: GetFeishuTableUrlDto) {
    const result = await this.modelTrainingService.getFeishuTableUrl(getFeishuTableUrlDto);
    return new SuccessResponse({ data: result });
  }

  @Post('feishu-table-headers')
  @ApiOperation({
    summary: '获取飞书表格表头',
    description: '根据飞书表格URL获取表格的表头信息',
  })
  async getFeishuTableHeaders(@Body() getFeishuTableHeadersDto: GetFeishuTableHeadersDto) {
    const result = await this.modelTrainingService.getFeishuTableHeaders(getFeishuTableHeadersDto);
    return new SuccessResponse({ data: result });
  }

  @Post('submit-data-upload-task')
  @ApiOperation({
    summary: '提交数据上传任务',
    description: '提交数据上传任务到外部服务进行处理',
  })
  async submitDataUploadTask(@Body() submitDataUploadTaskDto: SubmitDataUploadTaskDto) {
    const result = await this.modelTrainingService.submitDataUploadTask(submitDataUploadTaskDto);
    return new SuccessResponse({ data: result });
  }

  @Post('save-training-config')
  @ApiOperation({
    summary: '保存训练配置',
    description: '根据模型训练ID保存或更新训练配置参数',
  })
  async saveTrainingConfig(@Body() saveTrainingConfigDto: SaveTrainingConfigDto) {
    const result = await this.modelTrainingService.saveTrainingConfig(saveTrainingConfigDto);
    return new SuccessResponse({ data: result });
  }

  @Post('get-training-config')
  @ApiOperation({
    summary: '获取训练配置',
    description: '根据模型训练ID获取训练配置参数',
  })
  async getTrainingConfig(@Body() getTrainingConfigDto: GetTrainingConfigDto) {
    const result = await this.modelTrainingService.getTrainingConfig(getTrainingConfigDto);
    return new SuccessResponse({ data: result });
  }

  @Post('get-test-table-config')
  @ApiOperation({
    summary: '获取测试表配置',
    description: '根据模型训练ID获取测试表配置参数',
  })
  async getTestTableConfig(@Body() getTestTableConfigDto: GetTestTableConfigDto) {
    const result = await this.modelTrainingService.getTestTableConfig(getTestTableConfigDto);
    return new SuccessResponse({ data: result });
  }

  @Post('create-test-table-url')
  @ApiOperation({
    summary: '创建测试表链接',
    description: '根据模型训练ID创建测试表并返回链接',
  })
  async createTestTableUrl(@Body() createTestTableUrlDto: CreateTestTableUrlDto) {
    const result = await this.modelTrainingService.createTestTableUrl(createTestTableUrlDto);
    return new SuccessResponse({ data: result });
  }

  @Post('upload-data-to-test-table')
  @ApiOperation({
    summary: '上传数据到测试表',
    description: '上传数据到已创建的测试表',
  })
  async uploadDataToTestTable(@Body() uploadDataToTestTableDto: UploadDataToTestTableDto) {
    const result = await this.modelTrainingService.uploadDataToTestTable(uploadDataToTestTableDto);
    return new SuccessResponse({ data: result });
  }

  @Post('get-model-test-config')
  @ApiOperation({
    summary: '获取模型测试配置',
    description: '根据模型训练ID获取模型测试配置参数',
  })
  async getModelTestConfig(@Body() getModelTestConfigDto: GetModelTestConfigDto) {
    const result = await this.modelTrainingService.getModelTestConfig(getModelTestConfigDto);
    return new SuccessResponse({ data: result });
  }

  @Post('start-model-test')
  @ApiOperation({
    summary: '开始模型测试',
    description: '提交模型测试任务到外部服务',
  })
  async startModelTest(@Body() startModelTestDto: StartModelTestDto) {
    const result = await this.modelTrainingService.startModelTest(startModelTestDto);
    return new SuccessResponse({ data: result });
  }
}
