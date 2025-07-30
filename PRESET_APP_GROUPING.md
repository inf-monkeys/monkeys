# 预置应用分组策略

## 概述

本系统实现了基于 `appId` 的预置应用分组和排序策略，替代了原有的固定到默认分组的机制。现在预置应用会根据其 `appId` 自动分配到相应的分组中，并按照配置的排序规则进行排列。

## 功能特性

### 1. 智能分组
- 根据 `appId` 自动将预置应用分配到对应分组
- 支持自定义分组名称和排序
- 未配置的应用自动分配到"其他应用"分组

### 2. 灵活排序
- 分组级别的排序：控制不同分组的显示顺序
- 应用级别的排序：控制同一分组内应用的显示顺序
- 支持动态配置，无需修改代码

### 3. 配置化
- 通过 JSON 配置文件自定义分组策略
- 支持环境变量指定配置文件路径
- 支持多级配置文件查找

## 配置方法

### 1. 创建配置文件

复制示例配置文件：
```bash
cp appIdGroupStrategy.example.json appIdGroupStrategy.json
```

### 2. 配置文件结构

```json
{
  "groupNameMap": {
    "llm": "AI 对话",
    "image": "图像生成",
    "productivity": "效率工具"
  },
  "groupSortOrder": [
    "llm",
    "image", 
    "productivity"
  ],
  "appSortOrder": {
    "llm": [
      "662a1c620b9fd2739ab8d3a6",
      "662a1c620b9fd2739ab8d3a7"
    ],
    "image": [
      "665569753c72460540612445"
    ]
  },
  "defaultGroupName": "其他应用"
}
```

### 3. 配置项说明

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `groupNameMap` | Object | 分组键名到显示名称的映射 |
| `groupSortOrder` | Array | 分组的排序顺序 |
| `appSortOrder` | Object | 每个分组内应用的排序顺序 |
| `defaultGroupName` | String | 默认分组名称 |

### 4. 配置文件路径

系统按以下顺序查找配置文件：

1. `MONKEYS_APP_ID_GROUP_STRATEGY_FILE` 环境变量指定的路径
2. `/etc/monkeys/appIdGroupStrategy.{appId}.json`
3. `./appIdGroupStrategy.{appId}.json`
4. `/etc/monkeys/appIdGroupStrategy.json`
5. `./appIdGroupStrategy.json`

## 默认分组策略

系统内置了以下默认分组：

| 分组键 | 显示名称 | 包含应用类型 |
|--------|----------|--------------|
| `llm` | AI 对话 | 文本对话、文本补全、文本生成 |
| `image` | 图像生成 | 图像生成应用 |
| `productivity` | 效率工具 | 教学导师、文本总结、流程图解释等 |
| `content` | 内容创作 | 中文润色、信息整理、商务邮件等 |
| `hr` | 人力资源 | MBTI测试、绩效评估、面试问题等 |
| `marketing` | 内容营销 | 科普创作、网站审核、SEO优化等 |
| `translation` | 翻译工具 | 中英文翻译、科研文章翻译等 |

## 使用方法

### 1. 基本使用

安装预置应用时，系统会自动应用分组策略：

```typescript
// 在团队创建或用户首次使用时
await marketplaceService.installPresetApps(teamId, userId);
```

### 2. 自定义分组

修改 `appIdGroupStrategy.json` 文件：

```json
{
  "groupNameMap": {
    "my-custom-group": "我的自定义分组"
  },
  "groupSortOrder": [
    "llm",
    "my-custom-group",
    "image"
  ],
  "appSortOrder": {
    "my-custom-group": [
      "your-app-id-1",
      "your-app-id-2"
    ]
  }
}
```

### 3. 添加新应用

在 `appSortOrder` 中添加新的 `appId`：

```json
{
  "appSortOrder": {
    "llm": [
      "662a1c620b9fd2739ab8d3a6",
      "new-llm-app-id"
    ]
  }
}
```

## 技术实现

### 1. 核心函数

- `getGroupKeyByAppId(appId)`: 根据 appId 获取分组键
- `getGroupNameByAppId(appId)`: 根据 appId 获取分组显示名称
- `getAppSortIndex(appId)`: 获取应用在分组内的排序索引
- `getGroupSortIndex(groupKey)`: 获取分组的排序索引

### 2. 后端实现

在 `AssetsMarketPlaceRepository.forkBuiltInWorkflowAssetsFromMarketPlace()` 方法中：

1. 遍历所有预置应用
2. 根据 `appId` 确定分组和排序
3. 创建或获取现有分组
4. 将应用页面添加到对应分组
5. 按排序规则保存分组

### 3. 前端实现

前端的分组排序逻辑在 `pageGroupProcess()` 函数中，支持：
- 内置分组的优先显示
- 分组级别的排序
- 应用级别的排序

## 注意事项

1. **配置文件格式**: 确保 JSON 格式正确，避免语法错误
2. **appId 唯一性**: 每个 `appId` 只能出现在一个分组中
3. **排序索引**: 未配置的应用会排在最后（索引 999999）
4. **分组名称**: 建议使用有意义的名称，便于用户理解
5. **向后兼容**: 修改配置不会影响已存在的分组，只会影响新安装的应用

## 故障排除

### 1. 配置文件未生效

检查配置文件路径和格式：
```bash
# 检查配置文件是否存在
ls -la appIdGroupStrategy.json

# 验证 JSON 格式
cat appIdGroupStrategy.json | jq .
```

### 2. 应用未正确分组

检查 `appId` 是否在配置中：
```typescript
import { getGroupKeyByAppId } from '@/modules/assets/assets.marketplace.data';

const groupKey = getGroupKeyByAppId('your-app-id');
console.log('Group key:', groupKey);
```

### 3. 排序不正确

检查排序配置：
```typescript
import { getAppSortIndex, getGroupSortIndex } from '@/modules/assets/assets.marketplace.data';

const appIndex = getAppSortIndex('your-app-id');
const groupIndex = getGroupSortIndex('your-group-key');
console.log('App index:', appIndex, 'Group index:', groupIndex);
```

## 更新日志

- **v1.0.0**: 初始版本，支持基于 appId 的分组和排序
- 支持配置文件自定义分组策略
- 支持分组级别和应用级别的排序
- 提供默认分组策略 