import { Body, Controller, Post } from '@nestjs/common';
import { RegisterWorkerDto } from './dto/req/register-worker.dto';
import { WorkerService } from './worker.service';

@Controller('worker')
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post('/register')
  public async registerWorker(@Body() body: RegisterWorkerDto) {
    const { menifestJsonUrl } = body;
    return await this.workerService.registerWorker({
      menifestJsonUrl,
    });
  }
}
