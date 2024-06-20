import { conductorClient } from '@/common/conductor';
import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';
import jsonpath from 'jsonpath';

export default defineNode({
  type: ToolType.SIMPLE,
  name: 'collect_dowhile_output',
  categories: ['process'],
  displayName: '收集循环结果',
  description: '收集循环节点的执行结果',
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      name: 'doWhileTaskReferenceName',
      type: 'string',
      required: true,
      displayName: '循环节点 Task Reference Name',
      typeOptions: {
        assemblyValueType: 'taskReferenceName',
      },
    },
    {
      name: 'jsonPathExpression',
      type: 'string',
      required: false,
      displayName: 'Json Path 表达式',
      typeOptions: {
        assemblyValueType: 'jsonpath',
      },
    },
    {
      displayName: `
## JSONPath 语法说明

JSON Path 是 Stefan Goessner 在他在 [http://goessner.net/articles/JsonPath/](http://goessner.net/articles/JsonPath/) 与 2027 年提出的，详细使用文档请见：[https://github.com/dchester/jsonpath](https://github.com/dchester/jsonpath)。以下是一些常见的用法：

JSONPath         | 描述
-----------------|------------
\`$\`               | The root object/element
\`@\`                | The current object/element
\`.\`                | Child member operator
\`..\`	         | Recursive descendant operator; JSONPath borrows this syntax from E4X
\`*\`	         | Wildcard matching all objects/elements regardless their names
\`[]\`	         | Subscript operator
\`[,]\`	         | Union operator for alternate names or array indices as a set
\`[start:end:step]\` | Array slice operator borrowed from ES4 / Python
\`?()\`              | Applies a filter (script) expression via static evaluation
\`()\`	         | Script expression via static evaluation 


## 具体示例

假如输入数据如下：

\`\`\`javascript
{
  "store": {
    "book": [ 
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      }, {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      }, {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      }, {
          "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}
\`\`\`

示例的 jsonpath 表达式：

JSONPath                      | 描述
------------------------------|------------
\`$.store.book[*].author\`       | The authors of all books in the store
\`$..author\`                     | All authors
\`$.store.*\`                    | All things in store, which are some books and a red bicycle
\`$.store..price\`                | The price of everything in the store
\`$..book[2]\`                    | The third book
\`$..book[(@.length-1)]\`         | The last book via script subscript
\`$..book[-1:]\`                  | The last book via slice
\`$..book[0,1]\`                  | The first two books via subscript union
\`$..book[:2]\`                  | The first two books via subscript array slice
\`$..book[?(@.isbn)]\`            | Filter all books with isbn number
\`$..book[?(@.price<10)]\`        | Filter all books cheaper than 10
\`$..book[?(@.price==8.95)]\`        | Filter all books that cost 8.95
\`$..book[?(@.price<30 && @.category=="fiction")]\`        | Filter all fiction books cheaper than 30
\`$..*\`                         | All members of JSON structure
      `,
      name: 'docs',
      type: 'notice',
    },
  ],
  output: [
    {
      name: 'data',
      type: 'json',
      displayName: '输出结果，为一个对象',
    },
  ],
  extra: {
    estimateTime: 3,
  },

  handler: async (inputs: { [x: string]: any }, context) => {
    const { doWhileTaskReferenceName, jsonPathExpression } = inputs;
    const { workflowInstanceId } = context;
    const collectDoWhileOutputInSubworkflow = async (workflowInstanceId: string, collectData: (taskReferenceName: string, data: any) => void) => {
      const data = await conductorClient.workflowResource.getExecutionStatus(workflowInstanceId, true, true, true);
      const { tasks } = data;
      for (const task of tasks) {
        if (task.taskType === 'DO_WHILE') {
          continue;
        }
        const { outputData, taskType } = task;
        if (taskType === 'SUB_WORKFLOW') {
          await collectDoWhileOutputInSubworkflow(outputData.subWorkflowId, collectData);
        } else {
          const { referenceTaskName } = task;
          const referenceTaskNameWithoutSuffix = referenceTaskName.split('__')[0];
          collectData(referenceTaskNameWithoutSuffix, outputData);
        }
      }
    };

    let result: { [x: string]: any[] } | any = {};
    const collectData = (taskReferenceName: string, data: any) => {
      if (!result[taskReferenceName]) {
        result[taskReferenceName] = [];
      }
      result[taskReferenceName].push(data);
    };

    const data = await conductorClient.workflowResource.getExecutionStatus(workflowInstanceId!, true, true, true);
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
            await collectDoWhileOutputInSubworkflow(loopItemOutput.subWorkflowId, collectData);
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
  },
});
