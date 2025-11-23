import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { generateDbId } from '@/common/utils';
import { getMimeType } from '@/common/utils/file';
import { getI18NValue } from '@/common/utils/i18n';
import { ModelTrainingEntity, ModelTrainingStatus } from '@/database/entities/model-training/model-training';
import { ModelTrainingConfigEntity } from '@/database/entities/model-training/model-training-config';
import { ModelTrainingConfigV2Entity } from '@/database/entities/model-training/model-training-config-v2';
import { AssetsTagService } from '@/modules/assets/assets.tag.service';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateId } from 'ai';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { AnalyzeTensorboardDto, AnalyzeTensorboardResponseDto } from './dto/analyze-tensorboard.dto';
import { AnalyzeTrainingLogDto, AnalyzeTrainingLogResponseDto } from './dto/analyze-training-log.dto';
import { CreateModelTrainingDto } from './dto/create-model-training.dto';
import { CreateTestTableUrlDto, CreateTestTableUrlResponseDto } from './dto/create-test-table-url.dto';
import { FeishuTableHeadersResponseDto, GetFeishuTableHeadersDto } from './dto/get-feishu-table-headers.dto';
import { FeishuTableUrlResponseDto, GetFeishuTableUrlDto } from './dto/get-feishu-table-url.dto';
import { GetModelTestConfigDto, GetModelTestConfigResponseDto } from './dto/get-model-test-config.dto';
import { GetTestTableConfigDto, GetTestTableConfigResponseDto } from './dto/get-test-table-config.dto';
import { GetTrainingConfigDto } from './dto/get-training-config.dto';
import { SaveTrainingConfigDto, SaveTrainingConfigResponseDto } from './dto/save-training-config.dto';
import { StartDataUploadDto } from './dto/start-data-upload.dto';
import { StartModelTestDto, StartModelTestResponseDto } from './dto/start-model-test.dto';
import { StartModelTestV2Dto, StartModelTestV2ResponseDto } from './dto/start-model-test-v2.dto';
import { SubmitDataUploadTaskDto, SubmitDataUploadTaskResponseDto } from './dto/submit-data-upload-task.dto';
import { UploadDataToTestTableDto, UploadDataToTestTableResponseDto } from './dto/upload-data-to-test-table.dto';

@Injectable()
export class ModelTrainingService {
  constructor(
    @InjectRepository(ModelTrainingEntity)
    private readonly modelTrainingRepository: Repository<ModelTrainingEntity>,
    @InjectRepository(ModelTrainingConfigEntity)
    private readonly modelTrainingConfigRepository: Repository<ModelTrainingConfigEntity>,
    @InjectRepository(ModelTrainingConfigV2Entity)
    private readonly modelTrainingConfigV2Repository: Repository<ModelTrainingConfigV2Entity>,
    private readonly httpService: HttpService,
    private readonly mediaFileService: MediaFileService,
    private readonly assetsTagService: AssetsTagService,
  ) {}

  async create(createModelTrainingDto: CreateModelTrainingDto & { teamId: string }) {
    const id = generateDbId();
    const versionType = createModelTrainingDto.versionType ?? 1;
    const modelTraining = this.modelTrainingRepository.create({
      ...createModelTrainingDto,
      id,
      status: createModelTrainingDto.status ?? ModelTrainingStatus.IDLE,
      teamId: createModelTrainingDto.teamId,
      versionType,
    });

    // 保存训练任务
    const savedModelTraining = await this.modelTrainingRepository.save(modelTraining);

    // 根据 versionType 创建对应的配置记录
    const configId = generateDbId();
    if (versionType === 2) {
      // 模型训练2.0：在 model_training_config_v2 中创建
      const modelTrainingConfigV2 = this.modelTrainingConfigV2Repository.create({
        id: configId,
        modelTrainingId: savedModelTraining.id,
        data: null,
      });
      await this.modelTrainingConfigV2Repository.save(modelTrainingConfigV2);
    } else {
      // 模型训练1.0：在 model_training_config 中创建
      const modelTrainingConfig = this.modelTrainingConfigRepository.create({
        id: configId,
        modelTrainingId: savedModelTraining.id,
        versionType,
      });
      await this.modelTrainingConfigRepository.save(modelTrainingConfig);
    }

    return savedModelTraining;
  }

  async findById(id: string) {
    return this.modelTrainingRepository.findOne({ where: { id } });
  }

  public async findAllByTeamId(
    teamId: string,
    dto: ListDto,
  ): Promise<{
    totalCount: number;
    list: ModelTrainingEntity[];
  }> {
    const { page = 1, limit = 24, orderBy = 'DESC', orderColumn = 'createdTimestamp', filter, search } = dto;
    const searchText = typeof search === 'string' ? search.trim() : '';

    const queryBuilder = this.modelTrainingRepository.createQueryBuilder('mt').where('mt.team_id = :teamId', { teamId }).andWhere('mt.is_deleted = false');

    // Apply filtering if provided
    if (filter) {
      if (filter.createdTimestamp && filter.createdTimestamp.length === 2) {
        const [start, end] = filter.createdTimestamp;
        if (start) queryBuilder.andWhere('mt.created_timestamp >= :start', { start });
        if (end) queryBuilder.andWhere('mt.created_timestamp <= :end', { end });
      }
      // 添加 versionType 过滤
      if (filter.versionType !== undefined && filter.versionType !== null) {
        queryBuilder.andWhere('mt.version_type = :versionType', { versionType: filter.versionType });
      }
    }

    if (searchText) {
      queryBuilder.andWhere('(mt.display_name::text ILIKE :search OR mt.description::text ILIKE :search)', {
        search: `%${searchText}%`,
      });
    }

    // Count total number of projects
    const totalCount = await queryBuilder.getCount();

    // Apply ordering
    const validOrderColumns = {
      createdTimestamp: 'mt.created_timestamp',
      updatedTimestamp: 'mt.updated_timestamp',
    };
    const orderColumnSql = validOrderColumns[orderColumn] || 'mt.created_timestamp';

    // Apply pagination
    const modelTrainings = await queryBuilder
      .orderBy(orderColumnSql, orderBy.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getMany();

    return {
      totalCount,
      list: modelTrainings,
    };
  }

  async update(id: string, modelTraining: ModelTrainingEntity) {
    return this.modelTrainingRepository.update(id, modelTraining);
  }

  async delete(id: string) {
    try {
      // 先删除本地数据库中的数据
      const result = await this.modelTrainingRepository.update(id, { isDeleted: true });

      // 异步调用外部API删除训练任务（不阻塞删除操作）
      const modelTrainingEndpoint = config.modelTraining?.endpoint;
      if (modelTrainingEndpoint) {
        const apiUrl = `${modelTrainingEndpoint}/api/v1/model/training/${id}`;

        // 使用 Promise.race 添加超时，不阻塞删除操作
        // 不等待外部API调用完成，直接返回删除结果
        Promise.race([
          firstValueFrom(
            this.httpService.delete(apiUrl, {
              headers: {
                'Content-Type': 'application/json',
              },
            }),
          ),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
        ]).catch((externalError) => {
          // 外部API调用失败或超时，记录日志但不影响本地删除
          // console.error('外部API删除训练任务失败:', externalError);
        });
      }

      return result;
    } catch (error) {
      // console.error('删除模型训练失败:', error);
      throw error;
    }
  }

  /**
   * 开始模型训练
   * @param modelTrainingId 模型训练ID
   * @returns 训练结果
   */
  async startTraining(modelTrainingId: string): Promise<any> {
    try {
      // 先查找模型训练记录，确定 versionType
      const modelTraining = await this.modelTrainingRepository.findOne({
        where: { id: modelTrainingId },
      });

      if (!modelTraining) {
        throw new Error('模型训练记录不存在');
      }

      const versionType = modelTraining.versionType ?? 1;

      if (versionType === 2) {
        // 模型训练2.0：从 model_training_config_v2 的 data 字段读取配置
        const trainingConfigV2 = await this.modelTrainingConfigV2Repository.findOne({
          where: {
            modelTrainingId,
            isDeleted: false,
          },
        });

        if (!trainingConfigV2) {
          throw new Error(`未找到训练配置（modelTrainingId: ${modelTrainingId}），请先保存训练配置`);
        }

        if (!trainingConfigV2.data) {
          throw new Error(`训练配置数据为空（modelTrainingId: ${modelTrainingId}），请先保存训练配置`);
        }

        const configData = trainingConfigV2.data as Record<string, any>;

        // 字段名称映射（数据库字段名 -> 中文显示名）
        const fieldNameMap: Record<string, string> = {
          learning_rate: '学习率 (learning_rate)',
          unet_learning_rate: '网络学习率 (unet_learning_rate)',
          text_encoder_lr: '文本学习率 (text_encoder_lr)',
          output_name: '模型名称 (output_name)',
          model_training_type: '模型训练类型 (model_training_type)',
          repeat: '样本重复次数 (repeat)',
          max_train_epoches: '最大训练轮数 (max_train_epoches)',
          batch_size: '训练批次大小 (batch_size)',
          save_every_n_epochs: '每N轮保存一次 (save_every_n_epochs)',
          network_dim: '网络维度 (network_dim)',
          network_alpha: '网络缩放因子 (network_alpha)',
          pretrained_model: '底模选择 (pretrained_model)',
          file_storage_id: '文件存储ID (file_storage_id)',
        };

        // 验证必填字段
        const missingFields: string[] = [];
        if (!configData.learning_rate || (typeof configData.learning_rate === 'string' && configData.learning_rate.trim() === '')) {
          missingFields.push(fieldNameMap.learning_rate);
        }
        if (!configData.unet_learning_rate || (typeof configData.unet_learning_rate === 'string' && configData.unet_learning_rate.trim() === '')) {
          missingFields.push(fieldNameMap.unet_learning_rate);
        }
        if (!configData.text_encoder_lr || (typeof configData.text_encoder_lr === 'string' && configData.text_encoder_lr.trim() === '')) {
          missingFields.push(fieldNameMap.text_encoder_lr);
        }
        if (!configData.output_name || (typeof configData.output_name === 'string' && configData.output_name.trim() === '')) {
          missingFields.push(fieldNameMap.output_name);
        }
        if (!configData.model_training_type || (typeof configData.model_training_type === 'string' && configData.model_training_type.trim() === '')) {
          missingFields.push(fieldNameMap.model_training_type);
        }
        if (configData.repeat === undefined || configData.repeat === null) {
          missingFields.push(fieldNameMap.repeat);
        }
        if (configData.max_train_epoches === undefined || configData.max_train_epoches === null) {
          missingFields.push(fieldNameMap.max_train_epoches);
        }
        if (configData.batch_size === undefined || configData.batch_size === null) {
          missingFields.push(fieldNameMap.batch_size);
        }
        if (configData.save_every_n_epochs === undefined || configData.save_every_n_epochs === null) {
          missingFields.push(fieldNameMap.save_every_n_epochs);
        }
        if (configData.network_dim === undefined || configData.network_dim === null) {
          missingFields.push(fieldNameMap.network_dim);
        }
        if (configData.network_alpha === undefined || configData.network_alpha === null) {
          missingFields.push(fieldNameMap.network_alpha);
        }
        if (!configData.pretrained_model || (typeof configData.pretrained_model === 'string' && configData.pretrained_model.trim() === '')) {
          missingFields.push(fieldNameMap.pretrained_model);
        }
        if (!configData.file_storage_id || (typeof configData.file_storage_id === 'string' && configData.file_storage_id.trim() === '')) {
          missingFields.push(fieldNameMap.file_storage_id);
        }

        // 如果有未填写的字段，返回错误信息
        if (missingFields.length > 0) {
          throw new Error(`以下字段未填写：${missingFields.join('、')}`);
        }

        // 获取模型训练名称（project_name）
        const projectName = getI18NValue(modelTraining.displayName, 'zh-CN') || modelTraining.displayName || '未命名模型训练';

        // 模型类型转译：lora -> 1
        const modelType = configData.model_training_type === 'lora' ? 1 : 1; // 目前只支持 lora

        // 准备请求数据（按照后端API要求的字段名）
        const requestData: Record<string, any> = {
          pretrained_model: configData.pretrained_model,
          max_train_epoches: configData.max_train_epoches,
          batch_size: configData.batch_size,
          save_every_n_epochs: configData.save_every_n_epochs,
          network_dim: configData.network_dim,
          network_alpha: configData.network_alpha,
          learning_rate: configData.learning_rate,
          unet_lr: configData.unet_learning_rate, // 注意：API使用 unet_lr 而不是 unet_learning_rate
          text_encoder_lr: configData.text_encoder_lr,
          output_name: configData.output_name,
          model_type: modelType,
          model_training_id: modelTrainingId,
          project_name: projectName,
          repeat: configData.repeat,
        };

        // 添加 test_set（如果存在）
        if (configData.test_set !== undefined) {
          requestData.test_set = configData.test_set;
        }

        // 调用外部API
        const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
        const apiUrl = `${modelTrainingEndpoint}/api/v1/model/training`;

        const response = await firstValueFrom(
          this.httpService.post(apiUrl, requestData, {
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );

        if (response.data.code === 200) {
          // 更新模型训练状态为运行中
          await this.modelTrainingRepository.update(modelTrainingId, {
            status: ModelTrainingStatus.RUNNING,
          });

          return response.data.data;
        } else {
          throw new Error(`训练启动失败: ${response.data.message}`);
        }
      } else {
        // 模型训练1.0：保持原有逻辑不变
        const trainingConfig = await this.modelTrainingConfigRepository.findOne({
          where: { modelTrainingId },
        });

        if (!trainingConfig) {
          throw new Error('未找到训练配置，请先保存训练配置');
        }

        // 检查必需的配置字段
        const requiredFields = ['learningRate', 'modelName', 'modelTrainingType', 'maxTrainEpochs', 'trainBatchSize', 'saveEveryNEpochs'];

        const missingFields = requiredFields.filter((field) => {
          const value = trainingConfig[field];
          return value === null || value === undefined || value === '';
        });

        if (missingFields.length > 0) {
          throw new Error(`请填写训练配置：${missingFields.join(', ')}`);
        }

        // 模型类型转译
        let modelType: number;
        switch (trainingConfig.modelTrainingType) {
          case 'flux':
            modelType = 2;
            break;
          case 'lora':
            modelType = 1;
            break;
          default:
            throw new Error(`不支持的模型类型: ${trainingConfig.modelTrainingType}`);
        }

        // 准备请求数据
        const requestData = {
          learning_rate: trainingConfig.learningRate,
          max_train_epochs: trainingConfig.maxTrainEpochs,
          train_batch_size: trainingConfig.trainBatchSize,
          save_every_n_epochs: trainingConfig.saveEveryNEpochs,
          model_training_id: modelTrainingId,
          output_name: trainingConfig.modelName,
          model_type: modelType,
        };

        // 调用外部API
        const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
        const apiUrl = `${modelTrainingEndpoint}/api/v1/model/training`;

        const response = await firstValueFrom(
          this.httpService.post(apiUrl, requestData, {
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );

        if (response.data.code === 200) {
          // 更新模型训练状态为运行中
          await this.modelTrainingRepository.update(modelTrainingId, {
            status: ModelTrainingStatus.RUNNING,
          });

          return response.data.data;
        } else {
          throw new Error(`训练启动失败: ${response.data.message}`);
        }
      }
    } catch (error) {
      // console.error('开始模型训练失败:', error);
      throw new Error(`开始模型训练失败: ${error.message}`);
    }
  }

  /**
   * 停止模型训练
   * @param modelTrainingId 模型训练ID
   * @returns 停止结果
   */
  async stopTraining(modelTrainingId: string): Promise<any> {
    try {
      // 调用外部API停止训练
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/model/training/stop`;

      const requestData = {
        model_training_id: modelTrainingId,
      };

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        // 停止训练成功，不更新数据库状态，让外部API处理状态更新
        return response.data.data;
      } else {
        throw new Error(`停止训练失败: ${response.data.message}`);
      }
    } catch (error) {
      // console.error('停止模型训练失败:', error);
      throw new Error(`停止模型训练失败: ${error.message}`);
    }
  }

  /**
   * 获取数据上传任务状态
   * @param modelTrainingId 模型训练ID
   * @returns 数据上传任务状态
   */
  async getUploadTaskStatus(modelTrainingId: string): Promise<any> {
    try {
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/task/status/download/${modelTrainingId}`;

      const response = await firstValueFrom(
        this.httpService.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(`API调用失败: ${response.data.message || response.data.msg}`);
      }
    } catch (error) {
      // console.error('获取数据上传任务状态失败:', error);
      throw new Error(`获取数据上传任务状态失败: ${error.message}`);
    }
  }

  /**
   * 获取训练任务状态
   * @param modelTrainingId 模型训练ID
   * @returns 训练任务状态
   */
  async getTrainingStatus(modelTrainingId: string): Promise<any> {
    try {
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/task/status/training/${modelTrainingId}`;

      const response = await firstValueFrom(
        this.httpService.get(apiUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(`API调用失败: ${response.data.message}`);
      }
    } catch (error) {
      // console.error('获取训练任务状态失败:', error);
      throw new Error(`获取训练任务状态失败: ${error.message}`);
    }
  }

  /**
   * 获取飞书表格URL
   * @param dto 包含模型训练ID的DTO
   * @returns 飞书表格URL
   */
  async getFeishuTableUrl(dto: GetFeishuTableUrlDto): Promise<FeishuTableUrlResponseDto> {
    const { id } = dto;

    // 1. 先查询数据库中是否已有该训练任务的飞书表格URL
    const existingConfig = await this.modelTrainingConfigRepository.findOne({
      where: { modelTrainingId: id },
    });

    if (existingConfig && existingConfig.feishuTableUrl) {
      return { url: existingConfig.feishuTableUrl };
    }

    // 2. 如果数据库中没有，则调用外部API获取
    const modelTrainingEndpoint = config.modelTraining.endpoint;
    const apiUrl = `${modelTrainingEndpoint}/api/v1/create/table`;

    // console.log('调用外部API:', {
    //   endpoint: modelTrainingEndpoint,
    //   apiUrl,
    //   modelTrainingId: id,
    // });

    try {
      const requestData = {
        spreadsheet_url: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tbl15UTvvmfDTf5C&view=vew5h0JxuR',
        operation_mode: 3,
      };

      // console.log('发送请求数据:', requestData);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // 添加调试日志
      // console.log('外部API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有code字段，按原逻辑处理
        if (response.data.code === 200 && response.data.data?.url) {
          const feishuTableUrl = response.data.data.url;

          // 3. 如果找到了配置记录，更新它；否则创建新的配置记录
          if (existingConfig) {
            await this.modelTrainingConfigRepository.update(existingConfig.id, {
              feishuTableUrl,
            });
          } else {
            // 创建新的配置记录
            const configId = generateDbId();
            const newConfig = this.modelTrainingConfigRepository.create({
              id: configId,
              modelTrainingId: id,
              feishuTableUrl,
              feishuImageNameColumn: '', // 设置默认值
              feishuPromptColumn: '', // 设置默认值
              feishuImageColumn: '', // 设置默认值
              fileStorageId: '', // 设置默认值
              learningRate: '', // 设置默认值
              modelName: '', // 设置默认值
              modelTrainingType: '', // 设置默认值
              maxTrainEpochs: 0, // 设置默认值
              trainBatchSize: 0, // 设置默认值
              saveEveryNEpochs: 0, // 设置默认值
              feishuTestTableUrl: '', // 设置默认值
              modelPathPrefix: '', // 设置默认值
            });
            await this.modelTrainingConfigRepository.save(newConfig);
          }

          return { url: feishuTableUrl };
        }
        // 如果响应有url字段但没有code字段，直接使用
        else if (response.data.url) {
          const feishuTableUrl = response.data.url;

          // 保存到数据库
          if (existingConfig) {
            await this.modelTrainingConfigRepository.update(existingConfig.id, {
              feishuTableUrl,
            });
          } else {
            const configId = generateDbId();
            const newConfig = this.modelTrainingConfigRepository.create({
              id: configId,
              modelTrainingId: id,
              feishuTableUrl,
              feishuImageNameColumn: '',
              feishuPromptColumn: '',
              feishuImageColumn: '',
              fileStorageId: '',
              learningRate: '',
              modelName: '',
              modelTrainingType: '',
              maxTrainEpochs: 0,
              trainBatchSize: 0,
              saveEveryNEpochs: 0,
              feishuTestTableUrl: '',
              modelPathPrefix: '',
            });
            await this.modelTrainingConfigRepository.save(newConfig);
          }

          return { url: feishuTableUrl };
        }
        // 其他情况
        else {
          throw new Error(`API返回格式不正确: ${JSON.stringify(response.data)}`);
        }
      } else {
        throw new Error(`API返回数据格式错误: ${typeof response.data}`);
      }
    } catch (error) {
      throw new Error(`获取飞书表格URL失败: ${error.message}`);
    }
  }

  /**
   * 获取飞书表格表头
   * @param dto 包含飞书表格URL的DTO
   * @returns 表格表头列表
   */
  async getFeishuTableHeaders(dto: GetFeishuTableHeadersDto): Promise<FeishuTableHeadersResponseDto> {
    const { url } = dto;

    // 调用外部API获取表头
    const modelTrainingEndpoint = config.modelTraining.endpoint;
    const apiUrl = `${modelTrainingEndpoint}/api/v1/feishu/header`;

    // console.log('调用外部API获取表头:', {
    //   endpoint: modelTrainingEndpoint,
    //   apiUrl,
    //   spreadsheetUrl: url,
    // });

    try {
      const requestData = {
        spreadsheet_url: url,
      };

      // console.log('发送请求数据:', requestData);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // 添加调试日志
      // console.log('外部API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有code字段，按标准格式处理
        if (response.data.code === 200 && Array.isArray(response.data.data)) {
          return { headers: response.data.data };
        }
        // 如果响应直接是数组格式
        else if (Array.isArray(response.data)) {
          return { headers: response.data };
        }
        // 如果响应有data字段且是数组
        else if (Array.isArray(response.data.data)) {
          return { headers: response.data.data };
        }
        // 其他情况
        else {
          throw new Error(`API返回格式不正确: ${JSON.stringify(response.data)}`);
        }
      } else {
        throw new Error(`API返回数据格式错误: ${typeof response.data}`);
      }
    } catch (error) {
      throw new Error(`获取飞书表格表头失败: ${error.message}`);
    }
  }

  /**
   * 提交数据上传任务
   * @param dto 包含任务参数的DTO
   * @returns 任务提交结果
   */
  async submitDataUploadTask(dto: SubmitDataUploadTaskDto): Promise<SubmitDataUploadTaskResponseDto> {
    const { id, spreadsheet_url, image_column_name, txt_column_name, image_field, path_suffix = '100_1', summary_txt_name = '1', max_records_in_summary = 5 } = dto;

    // 调用外部API提交数据上传任务
    const modelTrainingEndpoint = config.modelTraining.endpoint;
    const apiUrl = `${modelTrainingEndpoint}/api/v1/data/pull`;

    // console.log('调用外部API提交数据上传任务:', {
    //   endpoint: modelTrainingEndpoint,
    //   apiUrl,
    //   modelTrainingId: id,
    // });

    try {
      const requestData = {
        model_training_id: id,
        spreadsheet_url,
        image_column_name,
        txt_column_name,
        image_field,
        path_suffix,
        summary_txt_name,
        max_records_in_summary,
      };

      // console.log('发送请求数据:', requestData);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // 添加调试日志
      // console.log('外部API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有code字段，按标准格式处理
        if (response.data.code !== undefined) {
          return {
            code: response.data.code,
            message: response.data.message || '任务提交完成',
          };
        }
        // 如果响应没有code字段，假设成功
        else {
          return {
            code: 200,
            message: '任务提交完成',
          };
        }
      } else {
        throw new Error(`API返回数据格式错误: ${typeof response.data}`);
      }
    } catch (error) {
      throw new Error(`提交数据上传任务失败: ${error.message}`);
    }
  }

  /**
   * 保存训练配置
   * @param dto 包含训练配置参数的DTO
   * @returns 保存结果
   */
  async saveTrainingConfig(dto: SaveTrainingConfigDto): Promise<SaveTrainingConfigResponseDto> {
    const {
      id,
      learning_rate,
      unet_learning_rate,
      text_encoder_lr,
      output_name,
      model_training_type,
      repeat,
      max_train_epoches,
      batch_size,
      save_every_n_epochs,
      network_dim,
      network_alpha,
      pretrained_model,
      file_storage_id,
      test_set,
      data_upload_tag_ids,
    } = dto;

    try {
      // 先查找模型训练记录，确定 versionType
      const modelTraining = await this.modelTrainingRepository.findOne({
        where: { id },
      });

      if (!modelTraining) {
        throw new Error('模型训练记录不存在');
      }

      const versionType = modelTraining.versionType ?? 1;

      if (versionType === 2) {
        // 模型训练2.0：保存到 model_training_config_v2 的 data 字段（JSON格式）
        // 字段名称映射（数据库字段名 -> 中文显示名）
        const fieldNameMap: Record<string, string> = {
          learning_rate: '学习率 (learning_rate)',
          unet_learning_rate: '网络学习率 (unet_learning_rate)',
          text_encoder_lr: '文本学习率 (text_encoder_lr)',
          output_name: '模型名称 (output_name)',
          model_training_type: '模型训练类型 (model_training_type)',
          repeat: '样本重复次数 (repeat)',
          max_train_epoches: '最大训练轮数 (max_train_epoches)',
          batch_size: '训练批次大小 (batch_size)',
          save_every_n_epochs: '每N轮保存一次 (save_every_n_epochs)',
          network_dim: '网络维度 (network_dim)',
          network_alpha: '网络缩放因子 (network_alpha)',
          pretrained_model: '底模选择 (pretrained_model)',
          file_storage_id: '文件存储ID (file_storage_id)',
        };

        // 验证必填字段
        const missingFields: string[] = [];
        if (!learning_rate || learning_rate.trim() === '') {
          missingFields.push(fieldNameMap.learning_rate);
        }
        if (!unet_learning_rate || unet_learning_rate.trim() === '') {
          missingFields.push(fieldNameMap.unet_learning_rate);
        }
        if (!text_encoder_lr || text_encoder_lr.trim() === '') {
          missingFields.push(fieldNameMap.text_encoder_lr);
        }
        if (!output_name || output_name.trim() === '') {
          missingFields.push(fieldNameMap.output_name);
        }
        if (!model_training_type || model_training_type.trim() === '') {
          missingFields.push(fieldNameMap.model_training_type);
        }
        if (repeat === undefined || repeat === null) {
          missingFields.push(fieldNameMap.repeat);
        }
        if (max_train_epoches === undefined || max_train_epoches === null) {
          missingFields.push(fieldNameMap.max_train_epoches);
        }
        if (batch_size === undefined || batch_size === null) {
          missingFields.push(fieldNameMap.batch_size);
        }
        if (save_every_n_epochs === undefined || save_every_n_epochs === null) {
          missingFields.push(fieldNameMap.save_every_n_epochs);
        }
        if (network_dim === undefined || network_dim === null) {
          missingFields.push(fieldNameMap.network_dim);
        }
        if (network_alpha === undefined || network_alpha === null) {
          missingFields.push(fieldNameMap.network_alpha);
        }
        if (!pretrained_model || pretrained_model.trim() === '') {
          missingFields.push(fieldNameMap.pretrained_model);
        }
        if (!file_storage_id || file_storage_id.trim() === '') {
          missingFields.push(fieldNameMap.file_storage_id);
        }

        // 验证学习率格式（数字e-数字格式，如：2e-5, 2.5e-6）
        const learningRateRegex = /^\d+(\.\d+)?e-\d+$/i;
        const invalidFields: string[] = [];

        if (learning_rate && !learningRateRegex.test(learning_rate.trim())) {
          invalidFields.push(fieldNameMap.learning_rate);
        }
        if (unet_learning_rate && !learningRateRegex.test(unet_learning_rate.trim())) {
          invalidFields.push(fieldNameMap.unet_learning_rate);
        }
        if (text_encoder_lr && !learningRateRegex.test(text_encoder_lr.trim())) {
          invalidFields.push(fieldNameMap.text_encoder_lr);
        }

        // 如果有格式错误的字段，返回错误信息
        if (invalidFields.length > 0) {
          return {
            success: false,
            message: `以下字段格式不正确（需要数字e-数字格式，如：2e-5 或 2.5e-6）：${invalidFields.join('、')}`,
          };
        }

        // 如果有未填写的字段，返回错误信息
        if (missingFields.length > 0) {
          return {
            success: false,
            message: `以下字段未填写：${missingFields.join('、')}`,
          };
        }

        // 使用数据库存储名称构建JSON对象
        const configData: Record<string, any> = {};
        if (learning_rate !== undefined) configData.learning_rate = learning_rate;
        if (unet_learning_rate !== undefined) configData.unet_learning_rate = unet_learning_rate;
        if (text_encoder_lr !== undefined) configData.text_encoder_lr = text_encoder_lr;
        if (output_name !== undefined) configData.output_name = output_name;
        if (model_training_type !== undefined) configData.model_training_type = model_training_type;
        if (repeat !== undefined) configData.repeat = repeat;
        if (max_train_epoches !== undefined) configData.max_train_epoches = max_train_epoches;
        if (batch_size !== undefined) configData.batch_size = batch_size;
        if (save_every_n_epochs !== undefined) configData.save_every_n_epochs = save_every_n_epochs;
        if (network_dim !== undefined) configData.network_dim = network_dim;
        if (network_alpha !== undefined) configData.network_alpha = network_alpha;
        if (pretrained_model !== undefined) configData.pretrained_model = pretrained_model;
        if (file_storage_id !== undefined) configData.file_storage_id = file_storage_id;
        if (data_upload_tag_ids !== undefined) configData.data_upload_tag_ids = data_upload_tag_ids;
        // 处理 test_set：如果是数字则存储为数字，如果是数组则存储为数组
        // 只有当 test_set 有有效值时才保存（数字必须在1-10之间，数组必须非空且不能全为空字符串）
        if (test_set !== undefined) {
          if (typeof test_set === 'number') {
            // 验证数字必须在1-10之间
            if (isNaN(test_set) || test_set < 1 || test_set > 10) {
              return {
                success: false,
                message: '测试集条数必须在1-10之间',
              };
            }
            configData.test_set = test_set;
          } else if (Array.isArray(test_set)) {
            // 验证数组不能为空，且不能所有元素都为空字符串
            if (test_set.length === 0) {
              return {
                success: false,
                message: '自定义测试集内容不能为空，请至少输入一条有效内容',
              };
            }
            // 检查是否所有元素都为空字符串
            const hasValidContent = test_set.some((item) => item && typeof item === 'string' && item.trim() !== '');
            if (!hasValidContent) {
              return {
                success: false,
                message: '自定义测试集内容不能全部为空，请至少输入一条有效内容',
              };
            }
            configData.test_set = test_set;
          }
        }

        // 查找或创建配置记录
        const existingConfigV2 = await this.modelTrainingConfigV2Repository.findOne({
          where: { modelTrainingId: id },
        });

        if (existingConfigV2) {
          // 更新现有配置
          await this.modelTrainingConfigV2Repository.update(existingConfigV2.id, {
            data: configData,
          });
          return {
            success: true,
            message: '训练配置更新成功',
          };
        } else {
          // 创建新的配置记录
          const configId = generateDbId();
          const newConfigV2 = this.modelTrainingConfigV2Repository.create({
            id: configId,
            modelTrainingId: id,
            data: configData,
          });
          await this.modelTrainingConfigV2Repository.save(newConfigV2);
          return {
            success: true,
            message: '训练配置创建成功',
          };
        }
      } else {
        // 模型训练1.0：保存到 model_training_config（保持原有逻辑）
        // 1.0使用旧的字段名：max_train_epochs, train_batch_size, model_name
        // 兼容处理：优先使用旧字段名，如果没有则使用新字段名
        const { max_train_epochs, train_batch_size, model_name } = dto;
        const max_train_epochs_value = max_train_epochs ?? max_train_epoches;
        const train_batch_size_value = train_batch_size ?? batch_size;
        const model_name_value = model_name ?? output_name;

        const existingConfig = await this.modelTrainingConfigRepository.findOne({
          where: { modelTrainingId: id },
        });

        if (existingConfig) {
          // 更新现有配置
          await this.modelTrainingConfigRepository.update(existingConfig.id, {
            learningRate: learning_rate,
            maxTrainEpochs: max_train_epochs_value,
            trainBatchSize: train_batch_size_value,
            saveEveryNEpochs: save_every_n_epochs,
            modelTrainingType: model_training_type,
            modelName: model_name_value,
          });
          return {
            success: true,
            message: '训练配置更新成功',
          };
        } else {
          // 创建新的配置记录
          const configId = generateDbId();
          const newConfig = this.modelTrainingConfigRepository.create({
            id: configId,
            modelTrainingId: id,
            learningRate: learning_rate,
            maxTrainEpochs: max_train_epochs_value,
            trainBatchSize: train_batch_size_value,
            saveEveryNEpochs: save_every_n_epochs,
            modelTrainingType: model_training_type,
            modelName: model_name_value,
            feishuTableUrl: '',
            feishuImageNameColumn: '',
            feishuPromptColumn: '',
            feishuImageColumn: '',
            fileStorageId: '',
            feishuTestTableUrl: '',
            modelPathPrefix: '',
          });
          await this.modelTrainingConfigRepository.save(newConfig);
          return {
            success: true,
            message: '训练配置创建成功',
          };
        }
      }
    } catch (error) {
      // console.error('保存训练配置失败:', error);
      throw new Error(`保存训练配置失败: ${error.message}`);
    }
  }

  /**
   * 获取训练配置
   * @param dto 包含模型训练ID的DTO
   * @returns 训练配置信息
   */
  async getTrainingConfig(dto: GetTrainingConfigDto): Promise<any> {
    const { id } = dto;

    try {
      // 先查找模型训练记录，确定 versionType
      const modelTraining = await this.modelTrainingRepository.findOne({
        where: { id },
      });

      if (!modelTraining) {
        throw new Error('模型训练记录不存在');
      }

      const versionType = modelTraining.versionType ?? 1;

      if (versionType === 2) {
        // 模型训练2.0：从 model_training_config_v2 的 data 字段读取JSON（使用数据库存储名称）
        const existingConfigV2 = await this.modelTrainingConfigV2Repository.findOne({
          where: { modelTrainingId: id },
        });

        if (existingConfigV2 && existingConfigV2.data) {
          // 如果存在配置，返回数据库中的数据（只返回 file_storage_id 作为必要字段）
          const configData = existingConfigV2.data as Record<string, any>;
          return {
            ...configData,
            file_storage_id: configData.file_storage_id || id, // 确保 file_storage_id 存在
          };
        } else {
          // 如果不存在配置，只返回 file_storage_id，其他字段让前端自己填写默认值
          return {
            file_storage_id: id,
          };
        }
      } else {
        // 模型训练1.0：从 model_training_config 读取（保持原有逻辑）
        const existingConfig = await this.modelTrainingConfigRepository.findOne({
          where: { modelTrainingId: id },
        });

        // 默认值
        const defaultValues = {
          fileStorageId: id, // 文件存储ID使用当前模型训练ID
          learningRate: '2e-6',
          modelName: '',
          modelTrainingType: '',
          maxTrainEpochs: 6,
          trainBatchSize: 1,
          saveEveryNEpochs: 2,
        };

        if (existingConfig) {
          // 如果存在配置，使用数据库中的值，空值使用默认值
          const config = {
            fileStorageId: id, // 文件存储ID始终使用模型训练ID
            learningRate: existingConfig.learningRate || defaultValues.learningRate,
            modelName: existingConfig.modelName || defaultValues.modelName,
            modelTrainingType: existingConfig.modelTrainingType || defaultValues.modelTrainingType,
            maxTrainEpochs: existingConfig.maxTrainEpochs || defaultValues.maxTrainEpochs,
            trainBatchSize: existingConfig.trainBatchSize || defaultValues.trainBatchSize,
            saveEveryNEpochs: existingConfig.saveEveryNEpochs || defaultValues.saveEveryNEpochs,
          };
          return config;
        } else {
          // 如果不存在配置，返回默认值
          return defaultValues;
        }
      }
    } catch (error) {
      // console.error('获取训练配置失败:', error);
      throw new Error(`获取训练配置失败: ${error.message}`);
    }
  }

  /**
   * 获取测试表配置
   * @param dto 包含模型训练ID的DTO
   * @returns 测试表配置信息
   */
  async getTestTableConfig(dto: GetTestTableConfigDto): Promise<GetTestTableConfigResponseDto> {
    const { id } = dto;

    try {
      // 根据model_training_id查找配置记录
      const existingConfig = await this.modelTrainingConfigRepository.findOne({
        where: { modelTrainingId: id },
      });

      // 基础配置
      const config = {
        fileStorageId: id, // 文件存储ID使用当前模型训练ID
        modelName: undefined,
        maxTrainEpochs: undefined,
        saveEveryNEpochs: undefined,
      };

      if (existingConfig) {
        // 如果存在配置，使用数据库中的值，空值不设置
        if (existingConfig.modelName) {
          config.modelName = existingConfig.modelName;
        }
        if (existingConfig.maxTrainEpochs) {
          config.maxTrainEpochs = existingConfig.maxTrainEpochs;
        }
        if (existingConfig.saveEveryNEpochs) {
          config.saveEveryNEpochs = existingConfig.saveEveryNEpochs;
        }

        // console.log('获取测试表配置成功:', {
        //   modelTrainingId: id,
        //   configId: existingConfig.id,
        //   config,
        // });
      } else {
        // console.log('未找到测试表配置，返回基础配置:', {
        //   modelTrainingId: id,
        //   config,
        // });
      }

      return config;
    } catch (error) {
      // console.error('获取测试表配置失败:', error);
      throw new Error(`获取测试表配置失败: ${error.message}`);
    }
  }

  /**
   * 创建测试表链接
   * @param dto 包含测试表参数的DTO
   * @returns 测试表链接
   */
  async createTestTableUrl(dto: CreateTestTableUrlDto): Promise<CreateTestTableUrlResponseDto> {
    const { id, model_name, max_train_epochs, save_every_n_epochs, custom_column = [], length_width = true } = dto;

    try {
      // 先查询数据库中是否已有测试表URL
      const existingConfig = await this.modelTrainingConfigRepository.findOne({
        where: { modelTrainingId: id },
      });

      if (existingConfig && existingConfig.feishuTestTableUrl) {
        // console.log('使用数据库中的测试表URL:', {
        //   modelTrainingId: id,
        //   configId: existingConfig.id,
        //   testTableUrl: existingConfig.feishuTestTableUrl,
        // });
        return { url: existingConfig.feishuTestTableUrl };
      }

      // 调用外部API创建测试表
      const modelTrainingEndpoint = config.modelTraining.endpoint;
      const apiUrl = `${modelTrainingEndpoint}/api/v1/create/table`;

      // console.log('调用外部API创建测试表:', {
      //   endpoint: modelTrainingEndpoint,
      //   apiUrl,
      //   modelTrainingId: id,
      // });

      const requestData = {
        spreadsheet_url: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tbl15UTvvmfDTf5C&view=vew5h0JxuR',
        operation_mode: 2,
        model_name,
        max_train_epochs,
        save_every_n_epochs,
        custom_column,
        length_width,
      };

      // console.log('发送请求数据:', requestData);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // 添加调试日志
      // console.log('外部API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        let testTableUrl = '';

        // 如果响应有code字段，按标准格式处理
        if (response.data.code === 200 && response.data.data?.url) {
          testTableUrl = response.data.data.url;
        }
        // 如果响应直接有url字段
        else if (response.data.url) {
          testTableUrl = response.data.url;
        }
        // 其他情况
        else {
          throw new Error(`API返回格式不正确: ${JSON.stringify(response.data)}`);
        }

        // 保存测试表URL到数据库
        if (existingConfig) {
          await this.modelTrainingConfigRepository.update(existingConfig.id, {
            feishuTestTableUrl: testTableUrl,
          });
        } else {
          const configId = generateDbId();
          const newConfig = this.modelTrainingConfigRepository.create({
            id: configId,
            modelTrainingId: id,
            feishuTestTableUrl: testTableUrl,
            feishuTableUrl: '',
            feishuImageNameColumn: '',
            feishuPromptColumn: '',
            feishuImageColumn: '',
            fileStorageId: '',
            learningRate: '',
            modelName: '',
            modelTrainingType: '',
            maxTrainEpochs: 0,
            trainBatchSize: 0,
            saveEveryNEpochs: 0,
            modelPathPrefix: '',
          });
          await this.modelTrainingConfigRepository.save(newConfig);
        }

        // console.log('测试表创建成功并保存到数据库:', {
        //   modelTrainingId: id,
        //   testTableUrl,
        // });

        return { url: testTableUrl };
      } else {
        throw new Error(`API返回数据格式错误: ${typeof response.data}`);
      }
    } catch (error) {
      // console.error('创建测试表链接失败:', error);
      throw new Error(`创建测试表链接失败: ${error.message}`);
    }
  }

  /**
   * 上传数据到测试表
   * @param dto 包含上传参数的DTO
   * @returns 上传结果
   */
  async uploadDataToTestTable(dto: UploadDataToTestTableDto): Promise<UploadDataToTestTableResponseDto> {
    const { id, quantity, model_training_id, save_path } = dto;

    try {
      // 先查询数据库中是否有测试表URL
      const existingConfig = await this.modelTrainingConfigRepository.findOne({
        where: { modelTrainingId: id },
      });

      if (!existingConfig || !existingConfig.feishuTestTableUrl) {
        // console.log('未找到测试表URL:', {
        //   modelTrainingId: id,
        //   hasConfig: !!existingConfig,
        //   hasTestTableUrl: !!existingConfig?.feishuTestTableUrl,
        // });
        return {
          code: 400,
          message: '上传失败：不存在测试表',
        };
      }

      // 调用外部API上传数据到测试表
      const modelTrainingEndpoint = config.modelTraining.endpoint;
      const apiUrl = `${modelTrainingEndpoint}/api/v1/data/upload`;

      // console.log('调用外部API上传数据到测试表:', {
      //   endpoint: modelTrainingEndpoint,
      //   apiUrl,
      //   modelTrainingId: id,
      //   testTableUrl: existingConfig.feishuTestTableUrl,
      // });

      // 根据save_path是否为空决定请求格式
      const requestData = save_path
        ? {
            spreadsheet_url: existingConfig.feishuTestTableUrl,
            quantity,
            save_path,
          }
        : {
            spreadsheet_url: existingConfig.feishuTestTableUrl,
            quantity,
            model_training_id,
          };

      // console.log('发送请求数据:', requestData);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // 添加调试日志
      // console.log('外部API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有code字段，按标准格式处理
        if (response.data.code !== undefined) {
          return {
            code: response.data.code,
            message: response.data.message || '数据上传完成',
          };
        }
        // 如果响应没有code字段，假设成功
        else {
          return {
            code: 200,
            message: '数据上传完成',
          };
        }
      } else {
        throw new Error(`API返回数据格式错误: ${typeof response.data}`);
      }
    } catch (error) {
      // console.error('上传数据到测试表失败:', error);
      throw new Error(`上传数据到测试表失败: ${error.message}`);
    }
  }

  /**
   * 获取模型测试配置
   * @param dto 包含模型训练ID的DTO
   * @returns 模型测试配置信息
   */
  async getModelTestConfig(dto: GetModelTestConfigDto): Promise<GetModelTestConfigResponseDto> {
    const { id } = dto;

    try {
      // 根据model_training_id查找配置记录
      const existingConfig = await this.modelTrainingConfigRepository.findOne({
        where: { modelTrainingId: id },
      });

      // 基础配置
      const config = {
        feishuTestTableUrl: undefined,
        modelTrainingType: undefined,
      };

      if (existingConfig) {
        // 如果存在配置，使用数据库中的值，空值不设置
        if (existingConfig.feishuTestTableUrl) {
          config.feishuTestTableUrl = existingConfig.feishuTestTableUrl;
        }
        if (existingConfig.modelTrainingType) {
          config.modelTrainingType = existingConfig.modelTrainingType;
        }

        // console.log('获取模型测试配置成功:', {
        //   modelTrainingId: id,
        //   configId: existingConfig.id,
        //   config,
        // });
      } else {
        // console.log('未找到模型测试配置，返回基础配置:', {
        //   modelTrainingId: id,
        //   config,
        // });
      }

      return config;
    } catch (error) {
      // console.error('获取模型测试配置失败:', error);
      throw new Error(`获取模型测试配置失败: ${error.message}`);
    }
  }

  /**
   * 开始模型测试
   * @param dto 包含测试参数的DTO
   * @returns 测试结果
   */
  async startModelTestV2(dto: StartModelTestV2Dto): Promise<StartModelTestV2ResponseDto> {
    const { model_training_id, model_path, lora_path = {}, test_txt = [] } = dto;

    try {
      // 构建请求数据
      const requestData: Record<string, any> = {
        model_training_id,
        model_path,
        lora_path,
      };

      // 如果有自定义测试文本，添加到请求中
      if (test_txt.length > 0) {
        requestData.test_txt = test_txt;
      }

      // 调用外部API
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30016';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/comfyui/fleet`;

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        return {
          code: 200,
          message: '测试启动成功',
          data: response.data.data,
        };
      } else {
        throw new Error(`测试启动失败: ${response.data.message || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('启动模型测试2.0失败:', error);
      throw new Error(error.message || '测试启动失败，请稍后重试');
    }
  }

  async startModelTest(dto: StartModelTestDto): Promise<StartModelTestResponseDto> {
    const { spreadsheet_url, model_type, path = '', custom_columns = [], length_width = false } = dto;

    try {
      // 处理自定义列和长宽设置
      const heading = [...custom_columns];

      // 如果开启了长宽功能且自定义列中有值，则添加"长宽"列
      if (length_width && custom_columns.length > 0) {
        heading.push('长宽');
      }

      // 映射模型类型字符串到数字
      const modelTypeMapping: Record<string, number> = {
        flux: 1, // Flux Dreambooth
        lora: 2, // Flux LoRA
        qwen: 3, // Qwen
      };

      const modelTypeNumber = modelTypeMapping[model_type] || 3; // 默认使用Qwen

      // 调用外部API开始模型测试
      const modelTrainingEndpoint = config.modelTraining.endpoint;
      const apiUrl = `${modelTrainingEndpoint}/api/v1/comfyui/fleet`;

      // console.log('调用外部API开始模型测试:', {
      //   endpoint: modelTrainingEndpoint,
      //   apiUrl,
      //   modelTrainingId: id,
      //   modelType: model_type,
      //   modelTypeNumber,
      // });

      const requestData = {
        spreadsheet_url,
        model_type: modelTypeNumber,
        path,
        heading,
        length_width,
      };

      // console.log('发送请求数据:', requestData);

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // 添加调试日志
      // console.log('外部API响应:', JSON.stringify(response.data, null, 2));

      // 检查响应格式
      if (response.data && typeof response.data === 'object') {
        // 如果响应有code字段，按标准格式处理
        if (response.data.code !== undefined) {
          return {
            code: response.data.code,
            message: response.data.message || '模型测试任务已提交',
          };
        }
        // 如果响应没有code字段，假设成功
        else {
          return {
            code: 200,
            message: '模型测试任务已提交',
          };
        }
      } else {
        throw new Error(`API返回数据格式错误: ${typeof response.data}`);
      }
    } catch (error) {
      // console.error('开始模型测试失败:', error);
      throw new Error(`开始模型测试失败: ${error.message}`);
    }
  }

  /**
   * 分析训练日志
   * @param dto 包含模型训练ID的DTO
   * @returns 训练日志分析结果
   */
  async analyzeTrainingLog(dto: AnalyzeTrainingLogDto): Promise<AnalyzeTrainingLogResponseDto> {
    const { model_training_id } = dto;

    try {
      // 调用外部API分析训练日志
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/training/log/analyze`;

      const requestData = {
        model_training_id,
      };

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(`训练日志分析失败: ${response.data.message}`);
      }
    } catch (error) {
      // console.error('分析训练日志失败:', error);
      throw new Error(`分析训练日志失败: ${error.message}`);
    }
  }

  /**
   * 分析TensorBoard事件文件
   * @param dto 包含模型训练ID的DTO
   * @returns TensorBoard分析结果
   */
  async analyzeTensorboard(dto: AnalyzeTensorboardDto): Promise<AnalyzeTensorboardResponseDto> {
    const { model_training_id } = dto;

    try {
      // 调用外部API分析TensorBoard事件文件
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/training/tensorboard/analyze`;

      const requestData = {
        model_training_id,
      };

      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(`TensorBoard分析失败: ${response.data.message}`);
      }
    } catch (error) {
      // console.error('分析TensorBoard失败:', error);
      throw new Error(`分析TensorBoard失败: ${error.message}`);
    }
  }

  /**
   * 开始数据上传
   * @param dto 开始数据上传DTO
   * @returns 上传结果
   */
  async startDataUpload(dto: StartDataUploadDto, teamId: string): Promise<any> {
    try {
      // 使用标签查询所有文件
      const listDto: ListDto = {
        page: 1,
        limit: 10000, // 足够大的值以获取所有文件
        filter: {
          tagIds: dto.tagIds,
          tagIdsAnd: true, // 使用AND逻辑
        },
      };

      // 查询所有匹配标签的文件
      const { list } = await this.mediaFileService.listRichMedias(teamId, listDto, undefined, 'exclude');

      if (!list || list.length === 0) {
        throw new Error('没有找到匹配标签的文件');
      }

      // 提取所有文件的数据（包含name和url）
      const fileData = list
        .filter((file) => file.url) // 过滤掉没有URL的文件
        .map((file) => {
          // 获取文件名，使用getI18NValue工具函数处理I18nValue
          const fileName = getI18NValue(file.displayName, 'zh-CN') || '未命名文件';

          return {
            name: fileName,
            url: file.url,
          };
        });

      if (fileData.length === 0) {
        throw new Error('文件URL为空');
      }

      // 构建请求数据
      const requestData = {
        project_name: dto.projectName,
        model_training_id: dto.modelTrainingId,
        data: fileData,
      };

      // 获取endpoint配置
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30025';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/model/data/download`;

      // 发送请求到模型训练服务
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200) {
        return response.data.data;
      } else {
        throw new Error(`数据上传失败: ${response.data.message || response.data.msg}`);
      }
    } catch (error) {
      throw new Error(`开始数据上传失败: ${error.message}`);
    }
  }

  /**
   * 获取底模列表
   * @param modelType 模型类型，默认为2
   * @param modelTrainingId 模型训练ID（可选，查询Lora模型时需要）
   * @returns 底模列表
   */
  async getPretrainedModels(modelType: string = '2', modelTrainingId?: string): Promise<string[]> {
    try {
      // 获取endpoint配置
      const modelTrainingEndpoint = config.modelTraining?.endpoint || 'http://sh-07.d.run:30016';
      const apiUrl = `${modelTrainingEndpoint}/api/v1/model/files`;

      // 构建请求参数
      const params: Record<string, any> = {
        model_type: modelType,
      };

      // 如果提供了model_training_id，添加到参数中
      if (modelTrainingId) {
        params.model_training_id = modelTrainingId;
      }

      // 调用外部API获取模型列表
      const response = await firstValueFrom(
        this.httpService.get(apiUrl, {
          params,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      if (response.data.code === 200 && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        throw new Error(`API返回格式不正确: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      throw new Error(`获取底模列表失败: ${error.message}`);
    }
  }

  /**
   * 上传文件并添加标签（异步处理）
   * @param file 文件对象
   * @param fileName 文件名称
   * @param tagIds 标签ID数组
   * @param teamId 团队ID
   * @param userId 用户ID
   */
  async uploadFileWithTags(file: any, fileName: string, tagIds: string[], teamId: string, userId: string): Promise<void> {
    // 验证必要参数
    if (!teamId) {
      console.error('[uploadFileWithTags] teamId 不能为空');
      throw new Error('teamId 不能为空');
    }
    if (!userId) {
      console.error('[uploadFileWithTags] userId 不能为空');
      throw new Error('userId 不能为空');
    }
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      console.error('[uploadFileWithTags] tagIds 必须是非空数组');
      throw new Error('tagIds 必须是非空数组');
    }

    // 保存变量到局部作用域，确保在异步函数中能正确访问
    const savedTeamId = String(teamId); // 确保是字符串
    const savedUserId = String(userId); // 确保是字符串
    const savedTagIds = tagIds.map((id) => String(id)); // 确保所有标签ID都是字符串
    const savedFileName = fileName;
    const savedFileBuffer = Buffer.from(file.buffer); // 复制buffer，避免引用问题
    // 如果 mimetype 为空，根据文件名推断
    const savedMimetype = file.mimetype || getMimeType(fileName);
    const savedFileSize = file.size;

    // 添加调试日志
    console.log('[uploadFileWithTags] 开始处理:', {
      savedTeamId,
      savedUserId,
      savedTagIds,
      savedFileName,
      savedMimetype,
      savedFileSize,
    });

    // 异步处理，不等待完成
    setImmediate(async () => {
      try {
        // 1. 计算文件MD5
        const md5 = createHash('md5').update(savedFileBuffer).digest('hex');

        // 2. 检查文件是否已存在（根据MD5）
        const existingMedia = await this.mediaFileService.getMediaByMd5(savedTeamId, md5);
        if (existingMedia) {
          // 如果文件已存在，直接为现有文件添加标签
          if (!savedTeamId) {
            console.error('[uploadFileWithTags] teamId 为空，无法添加标签');
            return;
          }
          await this.assetsTagService.updateAssetTags(savedTeamId, 'media-file', existingMedia.id, savedTagIds, true);
          return;
        }

        // 3. 上传文件到S3
        const s3Helpers = new S3Helpers();

        // 生成文件路径 - 从文件名中提取扩展名
        const fileNameParts = savedFileName.split('.');
        const fileExtension = fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : '';
        const fileId = generateId();
        const s3Key = `user-files/model-training-v2/${fileId}${fileExtension ? '.'.concat(fileExtension) : ''}`;

        // 上传到S3
        const fileUrl = await s3Helpers.uploadFile(savedFileBuffer, s3Key);

        // 4. 创建媒体文件记录
        // 使用完整的 mimetype 作为 type，前端代码支持通过 startsWith 检查
        // 如果 mimetype 为空或无效，根据文件扩展名推断
        let finalType = savedMimetype;

        if (!finalType || finalType === 'application/octet-stream' || finalType === 'binary/octet-stream') {
          // 如果 mimetype 无效，根据文件扩展名推断
          const ext = savedFileName.split('.').pop()?.toLowerCase() || '';
          const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'];
          const textExtensions = ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml', 'html', 'css', 'js', 'ts'];

          if (imageExtensions.includes(ext)) {
            // 根据扩展名推断 mimetype
            if (ext === 'jpg' || ext === 'jpeg') {
              finalType = 'image/jpeg';
            } else if (ext === 'png') {
              finalType = 'image/png';
            } else if (ext === 'gif') {
              finalType = 'image/gif';
            } else if (ext === 'webp') {
              finalType = 'image/webp';
            } else if (ext === 'bmp') {
              finalType = 'image/bmp';
            } else if (ext === 'svg') {
              finalType = 'image/svg+xml';
            } else {
              finalType = 'image/jpeg'; // 默认图片类型
            }
          } else if (textExtensions.includes(ext)) {
            finalType = 'text/plain';
          } else {
            finalType = 'image/jpeg'; // 默认类型
          }
        }

        // 添加调试日志
        console.log('[uploadFileWithTags] 文件类型判断:', {
          fileName: savedFileName,
          originalMimetype: savedMimetype,
          finalType: finalType,
        });

        const createMediaDto = {
          type: finalType as any, // 使用完整的 mimetype，前端支持通过 startsWith 检查
          displayName: savedFileName,
          url: fileUrl,
          source: 1, // MediaSource.UPLOAD
          size: savedFileSize,
          md5: md5,
        };

        const createdMedia = await this.mediaFileService.createMedia(savedTeamId, savedUserId, createMediaDto);

        // 5. 为文件添加标签
        if (savedTagIds && savedTagIds.length > 0) {
          if (!savedTeamId) {
            console.error('[uploadFileWithTags] teamId 为空，无法添加标签');
            return;
          }
          await this.assetsTagService.updateAssetTags(savedTeamId, 'media-file', createdMedia.id, savedTagIds, true);
        }
      } catch (error) {
        // 记录错误，但不抛出（因为是异步处理）
        console.error('[uploadFileWithTags] 处理失败:', error);
      }
    });
  }
}
