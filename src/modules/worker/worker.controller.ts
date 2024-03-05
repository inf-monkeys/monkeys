import { Body, Controller, Post } from '@nestjs/common';
import { RegisterWorkerDto } from './dto/req/register-worker.dto';
import { WorkerRegistryService } from './worker.registry.service';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerRegistryService: WorkerRegistryService) {}

  @Post('/register')
  public async registerWorker(@Body() body: RegisterWorkerDto) {
    const { menifestJsonUrl } = body;
    return await this.workerRegistryService.registerBlocks({
      menifestJsonUrl,
    });
  }
}
