import { Body, Controller, Post } from '@nestjs/common';
import { RegisterWorkerDto } from './dto/req/register-worker.dto';
import { ToolsRegistryService } from './tools.registry.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly workerRegistryService: ToolsRegistryService) {}

  @Post('/register')
  public async registerWorker(@Body() body: RegisterWorkerDto) {
    const { manifestJsonUrl } = body;
    return await this.workerRegistryService.registerToolsServer({
      manifestJsonUrl,
    });
  }
}
