import { Test, TestingModule } from '@nestjs/testing';
import { BuiltinToolsController } from './builtin.controller';

describe('BuiltinController', () => {
  let controller: BuiltinToolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuiltinToolsController],
    }).compile();

    controller = module.get<BuiltinToolsController>(BuiltinToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
