import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowCrudController } from './workflow.crud.controller';

describe('WorkflowController', () => {
  let controller: WorkflowCrudController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowCrudController],
    }).compile();

    controller = module.get<WorkflowCrudController>(WorkflowCrudController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
