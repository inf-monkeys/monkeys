# 图片宽高比自动检测功能

## 功能简介

在工作流中上传图片时，系统可以自动检测图片的宽高比，并将检测结果自动填充到指定的宽高比字段中。这样用户就不需要手动选择宽高比，提升了使用体验。

## 支持的宽高比

系统会自动将检测到的图片尺寸匹配到以下常见的宽高比预设：

| 宽高比 | 描述 | 典型用途 |
|--------|------|----------|
| 1:1 | 正方形 | 社交媒体头像、Instagram 帖子 |
| 4:3 | 标准横版 | 传统照片、PPT |
| 3:4 | 标准竖版 | 竖版照片 |
| 16:9 | 宽屏横版 | 视频、横屏显示器 |
| 9:16 | 宽屏竖版 | 竖屏视频、手机全屏 |
| 21:9 | 超宽屏 | 电影、超宽显示器 |
| 9:21 | 超宽竖版 | 竖版超宽内容 |
| 2:3 | 经典照片竖版 | 传统照片格式 |
| 3:2 | 经典照片横版 | 相机默认比例 |
| 5:4 | - | 打印照片 |
| 4:5 | - | 竖版打印 |

**匹配容差**：默认为 5%，即实际比例与预设比例的误差在 5% 以内时，会自动匹配到预设比例。如果实际比例与所有预设比例的差异都超过 5%，系统会计算并返回简化后的精确比例（如 "1024:768" 会简化为 "4:3"）。

## 配置方法

### 1. 在工作流输入配置中启用

在配置工作流的输入字段时，为**文件类型（file）**字段添加以下配置：

```json
{
  "name": "input_image",
  "displayName": "输入图片",
  "type": "file",
  "required": true,
  "multipleValues": false,
  "autoDetectAspectRatio": true,
  "aspectRatioField": "aspect_ratio"
}
```

### 2. 配置项说明

#### `autoDetectAspectRatio`（可选，默认 `false`）
- **类型**：`boolean`
- **说明**：是否启用图片宽高比自动检测
- **默认值**：`false`

#### `aspectRatioField`（可选，默认 `"aspect_ratio"`）
- **类型**：`string`
- **说明**：宽高比字段的名称，用于指定将检测结果填充到哪个字段
- **默认值**：`"aspect_ratio"`
- **注意**：确保工作流中存在对应名称的字段

### 3. 创建宽高比字段

确保在工作流中创建一个用于接收宽高比的字段，通常配置为下拉选择（select）类型：

```json
{
  "name": "aspect_ratio",
  "displayName": "宽高比",
  "type": "string",
  "required": false,
  "enableSelectList": true,
  "selectList": [
    { "value": "1:1", "label": "1:1 (正方形)" },
    { "value": "4:3", "label": "4:3 (标准)" },
    { "value": "3:4", "label": "3:4 (竖版标准)" },
    { "value": "16:9", "label": "16:9 (宽屏)" },
    { "value": "9:16", "label": "9:16 (竖版宽屏)" },
    { "value": "21:9", "label": "21:9 (超宽屏)" },
    { "value": "3:2", "label": "3:2 (相机)" }
  ]
}
```

## 完整示例

### 示例 1：基础配置

```json
{
  "inputs": [
    {
      "name": "input_image",
      "displayName": "上传图片",
      "type": "file",
      "required": true,
      "autoDetectAspectRatio": true
    },
    {
      "name": "aspect_ratio",
      "displayName": "宽高比",
      "type": "string",
      "required": false,
      "enableSelectList": true,
      "selectList": [
        { "value": "1:1", "label": "1:1" },
        { "value": "4:3", "label": "4:3" },
        { "value": "16:9", "label": "16:9" }
      ]
    }
  ]
}
```

### 示例 2：自定义字段名

如果宽高比字段不叫 `aspect_ratio`，可以通过 `aspectRatioField` 指定：

```json
{
  "inputs": [
    {
      "name": "source_image",
      "displayName": "源图片",
      "type": "file",
      "required": true,
      "autoDetectAspectRatio": true,
      "aspectRatioField": "image_ratio"
    },
    {
      "name": "image_ratio",
      "displayName": "图片比例",
      "type": "string",
      "required": false,
      "enableSelectList": true,
      "selectList": [
        { "value": "1:1", "label": "正方形" },
        { "value": "16:9", "label": "横屏" },
        { "value": "9:16", "label": "竖屏" }
      ]
    }
  ]
}
```

## 使用流程

1. **上传图片**：用户在工作流表单中上传图片
2. **自动检测**：系统读取图片的实际尺寸（宽度和高度）
3. **计算比例**：根据尺寸计算宽高比，并匹配到最接近的预设比例
4. **自动填充**：将检测到的宽高比自动填充到指定字段
5. **可手动修改**：用户可以手动修改自动填充的宽高比值

## 技术细节

### 检测算法

1. 使用 `Image` 对象加载图片并获取 `naturalWidth` 和 `naturalHeight`
2. 计算实际比例：`ratio = width / height`
3. 遍历预设比例列表，找到差异最小的预设
4. 如果相对误差 ≤ 5%，返回预设比例标签
5. 否则，使用最大公约数（GCD）算法简化比例为最简形式

### 错误处理

- 如果图片加载失败，会显示错误提示："无法自动检测图片宽高比"
- 检测失败不会阻止图片上传，用户可以手动选择宽高比
- 所有检测过程在控制台输出日志，便于调试

### 跨域问题

系统自动处理跨域图片加载：
- 首先尝试不使用 `crossOrigin` 属性加载
- 如果失败，自动尝试使用 `crossOrigin="anonymous"` 重新加载

## 注意事项

1. **字段名称匹配**：确保 `aspectRatioField` 指定的字段名称在工作流中存在
2. **字段类型**：宽高比字段建议使用 `string` 类型的下拉选择（select）
3. **选项列表**：宽高比字段的选项列表应包含常见的预设比例值
4. **仅首张图片**：如果上传多张图片，只会检测第一张图片的宽高比
5. **性能影响**：图片尺寸检测是异步操作，大型图片可能需要稍等片刻

## 相关代码

### 工具函数
- 文件路径：`ui/src/utils/file.ts`
- 主要函数：
  - `getImageSize(url: string)`: 获取图片尺寸
  - `calculateAspectRatio(width, height, tolerance)`: 计算宽高比
  - `detectAspectRatioFromUrl(imageUrl, tolerance)`: 从图片 URL 检测宽高比

### 组件实现
- 文件路径：`ui/src/components/layout/workspace/vines-view/form/tabular/render/field/file/index.tsx`
- 核心逻辑：在 `handleFilesChange` 函数中调用 `detectAspectRatioFromUrl`

### Schema 定义
- 文件路径：`ui/src/schema/workspace/workflow-input.ts`
- 新增字段：`autoDetectAspectRatio` 和 `aspectRatioField`

## 未来优化方向

- [ ] 支持自定义容差范围
- [ ] 支持批量检测多张图片
- [ ] 添加检测状态指示器
- [ ] 支持更多特殊宽高比预设
- [ ] 提供宽高比预设的国际化标签
