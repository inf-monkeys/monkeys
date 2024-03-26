import { Test, TestingModule } from '@nestjs/testing';
import { CanvasController } from './canvas.controller';

describe('CanvasController', () => {
  let controller: CanvasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CanvasController],
    }).compile();

    controller = module.get<CanvasController>(CanvasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
