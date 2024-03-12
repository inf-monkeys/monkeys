import { Test, TestingModule } from '@nestjs/testing';
import { ComfyuiController } from './comfyui.controller';

describe('ComfyuiController', () => {
  let controller: ComfyuiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComfyuiController],
    }).compile();

    controller = module.get<ComfyuiController>(ComfyuiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
