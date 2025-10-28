import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { ModelTrainingEntity, ModelTrainingStatus } from '@/database/entities/model-training/model-training';
import { ModelTrainingConfigEntity } from '@/database/entities/model-training/model-training-config';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { GetTrainingConfigDto, GetTrainingConfigResponseDto } from './dto/get-training-config.dto';
import { SaveTrainingConfigDto, SaveTrainingConfigResponseDto } from './dto/save-training-config.dto';
import { StartModelTestDto, StartModelTestResponseDto } from './dto/start-model-test.dto';
import { SubmitDataUploadTaskDto, SubmitDataUploadTaskResponseDto } from './dto/submit-data-upload-task.dto';
import { UploadDataToTestTableDto, UploadDataToTestTableResponseDto } from './dto/upload-data-to-test-table.dto';

@Injectable()
export class ModelTrainingService {
  constructor(
    @InjectRepository(ModelTrainingEntity)
    private readonly modelTrainingRepository: Repository<ModelTrainingEntity>,
    @InjectRepository(ModelTrainingConfigEntity)
    private readonly modelTrainingConfigRepository: Repository<ModelTrainingConfigEntity>,
    private readonly httpService: HttpService,
  ) {}

  async create(createModelTrainingDto: CreateModelTrainingDto & { teamId: string }) {
    const id = generateDbId();
    const modelTraining = this.modelTrainingRepository.create({
      ...createModelTrainingDto,
      id,
      status: createModelTrainingDto.status ?? ModelTrainingStatus.IDLE,
      teamId: createModelTrainingDto.teamId,
    });

    // 保存训练任务
    const savedModelTraining = await this.modelTrainingRepository.save(modelTraining);

    // 创建对应的配置记录
    const configId = generateDbId();
    const modelTrainingConfig = this.modelTrainingConfigRepository.create({
      id: configId,
      modelTrainingId: savedModelTraining.id,
    });

    await this.modelTrainingConfigRepository.save(modelTrainingConfig);

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

      // 调用外部API删除训练任务
      const modelTrainingEndpoint = config.modelTraining.endpoint;
      const apiUrl = `${modelTrainingEndpoint}/api/v1/model/training/${id}`;

      try {
        await firstValueFrom(
          this.httpService.delete(apiUrl, {
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );

        // console.log('外部API删除训练任务成功:', id);
      } catch (externalError) {
        // 外部API调用失败，记录日志但不影响本地删除
        // console.error('外部API删除训练任务失败:', externalError);
        // 可以选择是否抛出错误，这里选择继续执行
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
      // 查询训练配置
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
      const apiUrl = `${modelTrainingEndpoint}/api/v1/task/status/pg/sharding/${modelTrainingId}`;

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
    const { id, learning_rate, max_train_epochs, train_batch_size, save_every_n_epochs, model_training_type, model_name } = dto;

    try {
      // 根据model_training_id查找配置记录
      const existingConfig = await this.modelTrainingConfigRepository.findOne({
        where: { modelTrainingId: id },
      });

      if (existingConfig) {
        // 更新现有配置
        await this.modelTrainingConfigRepository.update(existingConfig.id, {
          learningRate: learning_rate,
          maxTrainEpochs: max_train_epochs,
          trainBatchSize: train_batch_size,
          saveEveryNEpochs: save_every_n_epochs,
          modelTrainingType: model_training_type,
          modelName: model_name,
        });

        // console.log('训练配置更新成功:', {
        //   modelTrainingId: id,
        //   configId: existingConfig.id,
        //   learningRate: learning_rate,
        //   maxTrainEpochs: max_train_epochs,
        //   trainBatchSize: train_batch_size,
        //   saveEveryNEpochs: save_every_n_epochs,
        //   modelTrainingType: model_training_type,
        //   modelName: model_name,
        // });

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
          maxTrainEpochs: max_train_epochs,
          trainBatchSize: train_batch_size,
          saveEveryNEpochs: save_every_n_epochs,
          modelTrainingType: model_training_type,
          modelName: model_name,
          feishuTableUrl: '',
          feishuImageNameColumn: '',
          feishuPromptColumn: '',
          feishuImageColumn: '',
          fileStorageId: '',
          feishuTestTableUrl: '',
          modelPathPrefix: '',
        });

        await this.modelTrainingConfigRepository.save(newConfig);

        // console.log('训练配置创建成功:', {
        //   modelTrainingId: id,
        //   configId: configId,
        //   learningRate: learning_rate,
        //   maxTrainEpochs: max_train_epochs,
        //   trainBatchSize: train_batch_size,
        //   saveEveryNEpochs: save_every_n_epochs,
        //   modelTrainingType: model_training_type,
        //   modelName: model_name,
        // });

        return {
          success: true,
          message: '训练配置创建成功',
        };
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
  async getTrainingConfig(dto: GetTrainingConfigDto): Promise<GetTrainingConfigResponseDto> {
    const { id } = dto;

    try {
      // 根据model_training_id查找配置记录
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

        // console.log('获取训练配置成功:', {
        //   modelTrainingId: id,
        //   configId: existingConfig.id,
        //   config,
        // });

        return config;
      } else {
        // 如果不存在配置，返回默认值
        // console.log('未找到训练配置，返回默认值:', {
        //   modelTrainingId: id,
        //   defaultValues,
        // });

        return defaultValues;
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
}
