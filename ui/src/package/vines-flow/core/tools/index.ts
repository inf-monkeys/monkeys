import { BlockType, MonkeyWorkflow } from '@inf-monkeys/vines';
import { BlockDefCategory } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { get, isArray, isBoolean, isNumber } from 'lodash';

import { VinesBase } from '@/package/vines-flow/core/base';
import {
  BUILT_IN_TOOLS,
  IGNORE_TOOLS,
  SUB_WORKFLOW_TOOL_CHOOSE_VERSION_PROP,
  TOOL_CATEGORY,
  TOOL_CATEGORY_SORT_INDEX_LIST,
} from '@/package/vines-flow/core/tools/consts.ts';
import {
  IVinesVariable,
  IVinesVariableGroupInfo,
  VinesToolDef,
  VinesToolDefProperties,
  VinesToolWithCategory,
  VinesVariableMapper,
} from '@/package/vines-flow/core/tools/typings.ts';
import { Constructor, VINES_STATUS } from '@/package/vines-flow/core/typings.ts';
import { format } from '@/utils/string-template.ts';

export function VinesTools<TBase extends Constructor<VinesBase>>(Base: TBase) {
  return class extends Base {
    private vinesTools: VinesToolDef[] = [];
    private vinesSubWorkflowTools: VinesToolDef[] = [];

    public tools: VinesToolDef[] = [];

    private toolInitialized = false;
    private subWorkflowInitialized = false;

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
      this.tools = this.vinesTools.concat(this.vinesSubWorkflowTools);
      if (this.status !== VINES_STATUS.IDLE) return;
      if (this.toolInitialized && this.subWorkflowInitialized) {
        this.status = VINES_STATUS.READY;
        this.sendEvent('refresh');
      }
    }

    public updateTools(tools: VinesToolDef[]) {
      this.vinesTools = tools.sort(
        (a, b) =>
          TOOL_CATEGORY_SORT_INDEX_LIST.indexOf(a.categories?.[0] ?? '') -
          TOOL_CATEGORY_SORT_INDEX_LIST.indexOf(b.categories?.[0] ?? ''),
      );
      this.toolInitialized = true;
      this.checkoutData();
    }

    public updateWorkflows(workflows: MonkeyWorkflow[]) {
      this.vinesSubWorkflowTools = workflows.map((workflow) => {
        const workflowId = workflow.workflowId;
        const variablesToTools: VinesToolDefProperties[] =
          workflow.variables?.map((v) => ({ ...v, name: `parameters.${v.name}` })) || [];

        return {
          type: BlockType.SUB_WORKFLOW,
          name: 'sub_workflow_'.concat(workflowId),
          displayName: workflow.displayName,
          input: [SUB_WORKFLOW_TOOL_CHOOSE_VERSION_PROP(workflowId), ...variablesToTools],
          output: this.workflowOutputToBlockDefProperties(workflow),
          icon: workflow.iconUrl,
          description: workflow.description || '工作流暂无描述',
          extra: workflow,
        };
      });
      this.subWorkflowInitialized = true;
      this.checkoutData();
    }

    private workflowOutputToBlockDefProperties(workflow: MonkeyWorkflow): VinesToolDefProperties[] {
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
        const finalBlock = workflow?.tasks?.at(-1);
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

    public getToolsByCategory(search?: string) {
      // 当前分类下的工具、数量、分类 ID、分类名称
      const tools: VinesToolWithCategory[] = [];
      for (const [category, categoryDisplayName] of Object.entries(TOOL_CATEGORY)) {
        if (category === 'all') {
          const allApp = this.tools.filter(({ displayName, name, description }) => {
            if (IGNORE_TOOLS.some((n) => name.startsWith(n))) return false;
            return !search ? true : [displayName, name, description].some((s) => s?.includes(search));
          });
          tools.push([allApp, allApp.length, category, categoryDisplayName]);

          const subWorkflowTools = this.vinesSubWorkflowTools.filter(({ displayName, name, description }) => {
            if (IGNORE_TOOLS.some((n) => name.startsWith(n))) return false;
            return !search ? true : [displayName, name, description].some((s) => s?.includes(search));
          });
          tools.push([subWorkflowTools, subWorkflowTools.length, 'block', '调用工作流']);
        } else {
          const appList = this.tools
            .filter(({ categories }) => categories?.includes(category as BlockDefCategory))
            .filter(({ displayName, name, description }) => {
              if (IGNORE_TOOLS.some((n) => name.startsWith(n))) return false;
              return !search ? true : [displayName, name, description].some((s) => s?.includes(search));
            });
          const listLength = appList.length;
          if (listLength) {
            tools.push([appList, listLength, category, categoryDisplayName]);
          }
        }
      }
      return tools.sort(
        (a, b) => TOOL_CATEGORY_SORT_INDEX_LIST.indexOf(a[2]) - TOOL_CATEGORY_SORT_INDEX_LIST.indexOf(b[2]),
      );
    }

    // region Variable
    public generateVariable(
      group: IVinesVariableGroupInfo,
      targetId: string,
      defs: VinesToolDefProperties[],
      nameTemplate = '${{target}.output.{variable}}',
      jsonpathTemplate = '$.{target}[*].{variable}',
      prev = '',
      prevIsMultipleValues = false,
    ): IVinesVariable[] {
      return defs.map(({ name, displayName, type, properties, typeOptions }) => {
        const isMultipleValues = prev && prevIsMultipleValues;
        const finalPrevOriginName = isMultipleValues ? prev.slice(0, -1) + '[0].' : prev;

        const finalVariable = finalPrevOriginName + name;

        const finalName = format(nameTemplate, { target: targetId, variable: finalVariable });
        const finalJsonpath = format(jsonpathTemplate, { target: targetId, variable: finalVariable });
        const isMultiple = get(typeOptions, 'multipleValues', false);

        return {
          group,
          id: finalName,
          jsonpath: finalJsonpath,
          originalName: finalVariable,
          label: displayName,
          type,
          targetId,
          isMultiple,
          children: properties
            ? this.generateVariable(
                group,
                targetId,
                properties,
                nameTemplate,
                jsonpathTemplate,
                `${finalVariable}.`,
                isMultiple,
              )
            : [],
          pathLabel: prev ? finalVariable : void 0,
        } as IVinesVariable;
      });
    }

    public generateVariableMapper(defs: IVinesVariable[], nodeName: string): VinesVariableMapper {
      const mapper: VinesVariableMapper = new Map();

      const flatVariables = (vars: IVinesVariable[] | undefined): IVinesVariable[] => {
        return vars?.flatMap((it) => [it, ...flatVariables(it.children)]) ?? [];
      };

      for (const def of flatVariables(defs)) {
        if (!def) continue;
        const { id, type, label, pathLabel, jsonpath, originalName } = def;
        const variableDisplayName = `${nodeName} 的 ${pathLabel || label}`;
        mapper.set(id, {
          name: originalName,
          displayName: variableDisplayName,
          type,
        });
        mapper.set(jsonpath, {
          name: jsonpath,
          displayName: variableDisplayName,
          type,
        });
      }

      return mapper;
    }
    // endregion
  };
}
