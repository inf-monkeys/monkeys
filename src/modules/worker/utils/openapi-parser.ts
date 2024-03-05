import { BlockDefPropertyTypes, BlockDefinition, BlockType } from '@inf-monkeys/vines';
import { OpenAPIObject, OperationObject, ParameterObject, ReferenceObject, RequestBodyObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const parseOpenApiSpecAsBlocks = (namespace: string, specData: OpenAPIObject): BlockDefinition[] => {
  const blocks: BlockDefinition[] = [];
  for (const path in specData.paths) {
    const pathItemObject = specData.paths[path];
    for (const method in pathItemObject) {
      if (['get', 'post', 'delete', 'put', 'patch', 'options', 'head', 'trace'].includes(method)) {
        const apiContent = pathItemObject[method] as OperationObject;
        const block: BlockDefinition = {
          type: BlockType.SIMPLE,
          name: `${namespace}__${method}__${path.replaceAll('/', '_')}`,
          displayName: apiContent.summary,
          description: apiContent.description,
          input: [],
          output: [],
          categories: apiContent['x-monkey-block-categories'] || [],
        };

        const blockDefInSpec = apiContent['x-monkey-block-def'];
        if (blockDefInSpec) {
          Object.assign(block, blockDefInSpec);
        } else {
          const parameters = apiContent.parameters;
          const requestBody = apiContent.requestBody as RequestBodyObject;
          const typeMap: { [x: string]: BlockDefPropertyTypes } = {
            string: 'string',
            boolean: 'boolean',
            number: 'number',
          };
          const addPropRecursive = (properties: any, requiredProperties: string[], parentFormItem: any) => {
            for (const name in properties) {
              let hasChildren = false;
              const { type, description, example, default: defaultValue, enum: enumValue, required: requiredDefinition, allOf, items, examples } = properties[name];

              let required = false;
              if (requiredDefinition) {
                required = true;
              }
              if (requiredProperties?.includes(name)) {
                required = true;
              }

              const placeholder = typeof example === 'object' ? JSON.stringify(example) : example;

              let formType;
              if (allOf) {
                formType = 'nestedJsonObject';
                hasChildren = true;
              } else if (items && items.$ref) {
                formType = 'nestedArray';
                hasChildren = true;
              } else if (typeMap[type]) {
                formType = typeMap[type];
              } else {
                formType = 'string';
              }
              const apiBodyFieldFormItem: any = {
                displayName: name,
                name: `BODY#${name}`,
                required,
                type: formType,
                description: description,
                placeholder,
              };
              if (defaultValue) {
                apiBodyFieldFormItem.default = defaultValue;
              }

              if (examples && Array.isArray(examples)) {
                apiBodyFieldFormItem.default = examples[0];
              }

              if (!!enumValue) {
                const options = [];
                const values = Object.values(enumValue);
                for (let i = 0; i < values.length; i++) {
                  options.push({ name: values[i], value: values[i] });
                }
                apiBodyFieldFormItem.type = 'options';
                apiBodyFieldFormItem.options = options;
              }

              if (parentFormItem) {
                if (!parentFormItem.children) {
                  parentFormItem.children = [];
                }
                parentFormItem.children.push(apiBodyFieldFormItem);
              } else {
                block.input.push(apiBodyFieldFormItem);
              }

              // 如果是嵌套结构，需要展开子选项
              if (hasChildren) {
                let childRef = null;
                if (allOf) {
                  childRef = allOf[0].$ref;
                } else if (items) {
                  childRef = items.$ref;
                }
                if (childRef) {
                  const dtoType = childRef.split('/')[childRef.split('/').length - 1];
                  const dto = specData.components.schemas[dtoType] as SchemaObject;
                  const properties = dto.properties;
                  addPropRecursive(properties, dto.required, apiBodyFieldFormItem);
                }
              }
            }
          };

          // TODO: 处理枚举值
          if ((requestBody?.content?.['application/json']?.schema as ReferenceObject)?.$ref) {
            const ref = (requestBody?.content?.['application/json']?.schema as ReferenceObject)?.$ref;
            const dtoType = ref.split('/')[ref.split('/').length - 1];
            const dto = specData.components.schemas[dtoType] as SchemaObject;
            const properties = dto.properties;
            addPropRecursive(properties, dto.required, null);
          }
          if (requestBody?.content?.['application/json']?.schema) {
            const dto = requestBody?.content?.['application/json']?.schema as SchemaObject;
            const properties = dto.properties;
            const required = dto.required;
            addPropRecursive(properties, required, null);
          }

          // parameters 是 query 里面的参数
          if (parameters?.length) {
            for (const parameter of parameters) {
              const { name, schema, description, example, required, in: placeIn = 'query' } = parameter as ParameterObject;
              const placeholder = typeof example === 'object' ? JSON.stringify(example) : example;
              const { type, enum: enumValue, default: defaultValue } = schema as any;
              let formType = undefined;
              if (typeMap[type]) {
                formType = typeMap[type];
              } else {
                formType = 'string';
              }
              const apiBodyFieldFormItem: any = {
                displayName: name,
                name: `${placeIn.toUpperCase()}#${name}`,
                required,
                type: formType,
                description: description,
                placeholder,
              };

              if (defaultValue) {
                apiBodyFieldFormItem.default = defaultValue;
              }

              if (!!enumValue) {
                const options = [];
                const values = Object.values(enumValue);
                for (let i = 0; i < values.length; i++) {
                  options.push({ name: values[i], value: values[i] });
                }
                apiBodyFieldFormItem.type = 'options';
                apiBodyFieldFormItem.options = options;
              }
              block.input.push(apiBodyFieldFormItem);
            }
          }
        }

        blocks.push(block);
      }
    }
  }

  return blocks;
};
