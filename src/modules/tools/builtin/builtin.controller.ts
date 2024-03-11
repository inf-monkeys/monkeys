import { MonkeyToolCategories, MonkeyToolExtra, MonkeyToolIcon, MonkeyToolInput, MonkeyToolName, MonkeyToolOutput } from '@/common/decorators/monkey-block-api-extensions.decorator';
import { IToolsRequest } from '@/common/typings/request';
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';
import { ApiType, AuthType, ManifestJson, SchemaVersion } from '../interfaces';
import { BuiltinToolsService } from './builtin.service';
import { BUILTIN_TOOL_OPENAPI_PATH } from './builtin.swagger';
import { CollectDoWhileOutputDto } from './dto/req/collect-dowhile-output.req.dto';

@Controller('/system-tools/')
export class BuiltinToolsController {
  constructor(private readonly service: BuiltinToolsService) {}

  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getMetadata(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      namespace: 'monkeys_builtin_tools',
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `${BUILTIN_TOOL_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('collect-dowhile-output')
  @ApiOperation({
    summary: '收集循环结果',
    description: '收集循环节点的执行结果',
  })
  @MonkeyToolName('collect_dowhile_output')
  @MonkeyToolCategories(['process'])
  @MonkeyToolIcon('emoji:🤖️:#7fa3f8')
  @MonkeyToolInput([
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
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: '输出结果，为一个对象',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 3,
  })
  public async collectDowhileOutput(@Req() req: IToolsRequest, @Body() body: CollectDoWhileOutputDto) {
    const { doWhileTaskReferenceName, jsonPathExpression } = body;
    const result = await this.service.collectDowhileOutput(doWhileTaskReferenceName, jsonPathExpression, req.context.workflowInstanceId);
    return result;
  }
}
