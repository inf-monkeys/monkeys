# 多图片支持功能说明

## 功能概述

DataCardView 组件现在支持展示多张图片。当 `media` 字段包含多个图片 URL 时，会显示图片数量角标，点击后打开详情页，在详情页中支持左右切换浏览所有图片。

## 实现方案

采用**混合方案**实现：
- **卡片视图**：显示第一张图片作为主图，右上角显示图片数量角标（例如：🖼️ 6）
- **鼠标悬停**：显示"查看全部 N 张图片"提示
- **点击交互**：点击多图卡片直接打开详情页
- **详情页轮播**：在详情页中支持左右箭头切换图片、底部索引指示器快速跳转

## 数据格式

### media 字段支持三种格式：

1. **单图片（字符串）**
```json
{
  "id": "1",
  "name": "商品名称",
  "media": "https://example.com/image.jpg",
  "thumbnail": "https://example.com/thumb.jpg"
}
```

2. **多图片（字符串数组）**
```json
{
  "id": "2",
  "name": "商品名称",
  "media": [
    "https://images-na.ssl-images-amazon.com/images/I/41VU9xxoUkL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41EwFspOspL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41IV%2BGAmEqL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/415GOcSCXQL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41jaCyzO5mL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41FIuzQwd0L.jpg"
  ],
  "thumbnail": "https://example.com/thumb.jpg"
}
```

3. **多图片（JSON 字符串）- 后端返回格式**
```json
{
  "id": "3",
  "name": "商品名称",
  "media": "[\"https://images-na.ssl-images-amazon.com/images/I/41VU9xxoUkL.jpg\", \"https://images-na.ssl-images-amazon.com/images/I/41EwFspOspL.jpg\"]",
  "thumbnail": "https://example.com/thumb.jpg"
}
```

**注意**：如果后端返回的 `media` 是 JSON 字符串格式（格式3），前端会自动解析成数组。解析逻辑在数据加载函数中：

```typescript
// 解析 media 字段（如果是 JSON 字符串）
const processedItems = response.items.map(item => {
  if (typeof item.media === 'string' && item.media.startsWith('[')) {
    try {
      item.media = JSON.parse(item.media);
    } catch (e) {
      console.warn('Failed to parse media field:', item.media);
    }
  }
  return item;
});
```

## 组件更新

### 1. MediaPreview 组件

更新了 `src` 属性类型，支持字符串数组：

```typescript
export interface MediaPreviewProps {
  src: string | string[];  // 支持单图或多图
  alt?: string;
  type?: 'image' | 'video' | '3d' | 'step' | 'auto';
  thumbnail?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  onViewAll?: () => void;  // 点击查看全部的回调
}
```

特性：
- 自动使用第一张图片作为主图
- 多图时显示数量角标
- 支持自定义 `onViewAll` 回调（点击后调用 onView 打开详情页）

### 2. DataDetailPanel 组件（新增轮播功能）

详情页组件添加了多图轮播功能：

特性：
- **自动检测多图**：检测 media 字段是否包含多张图片
- **左右箭头切换**：点击两侧的箭头按钮切换图片
- **索引指示器**：底部圆点指示器，显示当前位置并支持快速跳转
- **图片计数**：标题栏显示 "N / M" 表示当前第几张 / 总共几张
- **循环切换**：到达最后一张时点击下一张会回到第一张

界面元素：
- 左侧箭头按钮（ChevronLeft）
- 右侧箭头按钮（ChevronRight）
- 底部圆点指示器（当前图片高亮显示）
- 右上角计数显示（如 "3 / 6"）

### 3. DataCardView 组件

集成了多图支持，点击直接打开详情页：

```typescript
// 卡片点击处理
<MediaPreview
  src={Array.isArray(item.media) ? item.media : item.media || item.thumbnail || ''}
  alt={item.name}
  type="auto"
  thumbnail={item.thumbnail}
  aspectRatio="square"
  onViewAll={() => onView?.(item)}  // 点击后打开详情页
/>
```

## 用户体验

### 卡片视图
- **主图显示**：主图始终清晰显示
- **多图角标**：右上角显示图片数量（如 "🖼️ 6"）
- **悬停提示**：鼠标悬停显示"查看全部 6 张图片"
- **点击交互**：点击多图卡片直接打开详情页

### 详情页轮播
- **大图展示**：详情页大图居中展示，清晰可见
- **左右切换**：点击左右箭头按钮切换图片，或使用键盘方向键
- **快速跳转**：点击底部圆点指示器快速跳转到指定图片
- **位置显示**：右上角显示当前图片位置（如 "3 / 6"）
- **循环浏览**：支持循环切换，最后一张之后回到第一张

## 类型定义更新

在 `ui-admin/src/types/data.ts` 中更新了 `DataAsset` 接口：

```typescript
export interface DataAsset {
  // ... 其他字段
  media?: string | string[];  // 支持单图或多图
  thumbnail?: string;
  // ... 其他字段
}
```

## 向后兼容性

完全向后兼容，现有的单图数据无需修改即可正常工作：
- 字符串类型的 `media` 会被自动转换为单元素数组处理
- 不会破坏现有的展示逻辑

## 示例数据

```typescript
const multiImageData = {
  id: "product-123",
  name: "Amazon Product Example",
  media: [
    "https://images-na.ssl-images-amazon.com/images/I/41VU9xxoUkL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41EwFspOspL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41IV%2BGAmEqL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/415GOcSCXQL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41jaCyzO5mL.jpg",
    "https://images-na.ssl-images-amazon.com/images/I/41FIuzQwd0L.jpg"
  ],
  thumbnail: "https://images-na.ssl-images-amazon.com/images/I/41VU9xxoUkL.jpg"
};
```

## 未来增强

可以考虑的增强功能：
- 支持图片放大（Zoom/Pinch to Zoom）
- 支持图片下载
- 支持全屏查看模式
- 添加图片描述/标题字段
- 支持视频与图片混合展示
- 添加缩略图预览（类似画廊对话框的底部缩略图）
- 支持触摸滑动切换（移动端）
- 键盘快捷键支持（左右箭头、Esc 关闭等）
