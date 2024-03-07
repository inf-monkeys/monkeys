import { Body, Controller, Post } from '@nestjs/common';
import { RegisterWorkerDto } from './dto/req/register-worker.dto';
import { ToolsRegistryService } from './worker.registry.service';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerRegistryService: ToolsRegistryService) {}

  @Post('/register')
  public async registerWorker(@Body() body: RegisterWorkerDto) {
    const { manifestJsonUrl } = body;
    return await this.workerRegistryService.registerToolsServer({
      manifestJsonUrl,
    });
  }
}
