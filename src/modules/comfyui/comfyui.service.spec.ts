import { Test, TestingModule } from '@nestjs/testing';
import { ComfyuiService } from './comfyui.service';

describe('ComfyuiService', () => {
  let service: ComfyuiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComfyuiService],
    }).compile();

    service = module.get<ComfyuiService>(ComfyuiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
