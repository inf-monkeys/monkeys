import { Test, TestingModule } from '@nestjs/testing';
import { DesignController } from './design.controller';
import { DesignService } from './design.service';

describe('DesignController', () => {
  let controller: DesignController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DesignController],
      providers: [DesignService],
    }).compile();

    controller = module.get<DesignController>(DesignController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
