import { conductorClient } from '@/common/conductor';
import { Injectable } from '@nestjs/common';
import * as jsonpath from 'jsonpath';

@Injectable()
export class BuiltinToolsService {
  private async collectDoWhileInputInSubworkflow(workflowInstanceId: string, collectData: (taskReferenceName: string, data: any) => void) {
    const data = await conductorClient.workflowResource.getExecutionStatus(workflowInstanceId, true);
    const { tasks } = data;
    for (const task of tasks) {
      if (task.taskType === 'DO_WHILE') {
        continue;
      }
      const { outputData, taskType } = task;
      if (taskType === 'SUB_WORKFLOW') {
        await this.collectDoWhileInputInSubworkflow(outputData.subWorkflowId, collectData);
      } else {
        const { referenceTaskName } = task;
        const referenceTaskNameWithoutSuffix = referenceTaskName.split('__')[0];
        collectData(referenceTaskNameWithoutSuffix, outputData);
      }
    }
  }

  public async collectDowhileOutput(doWhileTaskReferenceName: string, jsonPathExpression: string, workflowInstanceId: string): Promise<{ [x: string]: any }> {
    let result: { [x: string]: any[] } | any = {};
    const collectData = (taskReferenceName: string, data: any) => {
      if (!result[taskReferenceName]) {
        result[taskReferenceName] = [];
      }
      result[taskReferenceName].push(data);
    };

    const data = await conductorClient.workflowResource.getExecutionStatus(workflowInstanceId!, true);
    const { tasks } = data;
    const doWhileTask = tasks.find((t: any) => t.taskType === 'DO_WHILE' && t.referenceTaskName === doWhileTaskReferenceName);
    if (!doWhileTask) {
      throw new Error(`循环节点 ${doWhileTaskReferenceName} 不存在！`);
    }

    const { outputData } = doWhileTask;
    const { iteration } = outputData;
    for (let i = 1; i <= iteration; i++) {
      const iterResult = outputData[i];

      const loopItemTaskReferenceNames = Object.keys(iterResult);
      for (const loopItemTaskReferenceName of loopItemTaskReferenceNames) {
        const loopItemOutput = iterResult[loopItemTaskReferenceName];
        // 说明是子流程
        if (loopItemOutput.subWorkflowId) {
          // 嵌套循环，递归获取每个节点的输出
          if (loopItemTaskReferenceName.startsWith('sub_workflow')) {
            delete loopItemOutput.subWorkflowId;
            collectData(loopItemTaskReferenceName, loopItemOutput);
          } else {
            await this.collectDoWhileInputInSubworkflow(loopItemOutput.subWorkflowId, collectData);
          }
        }
        // 说明是普通节点，可以加入到收集的数据
        else {
          collectData(loopItemTaskReferenceName, loopItemOutput);
        }
      }
    }

    if (jsonPathExpression) {
      result = jsonpath.query(result, jsonPathExpression);
    }

    return {
      data: result,
    };
  }
}
