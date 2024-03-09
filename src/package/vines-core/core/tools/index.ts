import { BlockType, MonkeyWorkflow } from '@inf-monkeys/vines';
import { get, isArray, isBoolean, isNumber } from 'lodash';

import { VinesBase } from '@/package/vines-core/core/base';
import {
  BUILT_IN_TOOLS,
  SUB_WORKFLOW_TOOL_CHOOSE_VERSION_PROP,
  TOOL_CATEGORY_SORT_INDEX_LIST,
} from '@/package/vines-core/core/tools/consts.ts';
import { VinesBlockDefProperties, VinesToolDef } from '@/package/vines-core/core/tools/typings.ts';
import { Constructor, VINES_STATUS } from '@/package/vines-core/core/typings.ts';

export function VinesTools<TBase extends Constructor<VinesBase>>(Base: TBase) {
  return class extends Base {
    private vinesTools: VinesToolDef[] = [];
    private vinesSubWorkflowTools: VinesToolDef[] = [];

    public tools: VinesToolDef[] = [];

    /**
     * 获取 Vines 工具链中的工具
     * @param key 工具名称
     * @param path 查询路径（lodash get）
     * */
    public getTool(key: string, path?: string) {
      return this.tools.concat(BUILT_IN_TOOLS).find((tool) => (path ? get(tool, path) === key : tool.name === key));
    }

    // ... other methods
    private checkoutData() {
      if (this.status !== VINES_STATUS.IDLE) return;
      if (this.vinesTools.length && this.vinesSubWorkflowTools.length) {
        this.tools = this.vinesTools.concat(this.vinesSubWorkflowTools);
        this.status = VINES_STATUS.READY;
        this.emit('update');
      }
    }

    public updateTools(tools: VinesToolDef[]) {
      this.vinesTools = tools.sort(
        (a, b) =>
          TOOL_CATEGORY_SORT_INDEX_LIST.indexOf(a.categories?.[0] ?? '') -
          TOOL_CATEGORY_SORT_INDEX_LIST.indexOf(b.categories?.[0] ?? ''),
      );
      this.checkoutData();
    }

    public updateWorkflows(workflows: MonkeyWorkflow[]) {
      this.vinesSubWorkflowTools = workflows.map((workflow) => {
        const workflowId = workflow.workflowId;
        const variablesToTools: VinesBlockDefProperties[] =
          workflow.variables?.map((v) => ({ ...v, name: `parameters.${v.name}` })) || [];

        return {
          type: BlockType.SUB_WORKFLOW,
          name: 'sub_workflow_'.concat(workflowId),
          displayName: workflow.name,
          input: [SUB_WORKFLOW_TOOL_CHOOSE_VERSION_PROP(workflowId), ...variablesToTools],
          output: this.workflowOutputToBlockDefProperties(workflow),
          icon: workflow.iconUrl,
          description: workflow.description || '工作流暂无描述',
          extra: workflow,
        };
      });
      this.checkoutData();
    }

    private workflowOutputToBlockDefProperties(workflow: MonkeyWorkflow): VinesBlockDefProperties[] {
      if (workflow?.output?.length) {
        return workflow.output.map(({ key, value }) => ({
          name: key,
          displayName: `工作流输出 ${key}`,
          type: (isNumber(value) && 'number') || (isBoolean(value) && 'boolean') || 'string',
          typeOptions: {
            multipleValues: isArray(value),
          },
        }));
      } else {
        const finalBlock = workflow.workflowDef?.tasks?.at(-1);
        if (!finalBlock) {
          return [];
        }
        const output = this.getTool(finalBlock.name.toLowerCase())?.output;
        if (!output) {
          return [];
        }
        return output;
      }
    }
  };
}
