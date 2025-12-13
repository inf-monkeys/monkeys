# 数据浏览器功能实现文档

## 概述

本文档描述了从 `ui-admin` 的数据管理功能迁移到 `ui` 项目的只读数据浏览器功能的完整实现。

## 实现方案

采用**复制组件 + 同步机制**方案：
- 从 `ui-admin` 复制组件到 `ui`
- 创建独立的用户级别只读 API
- 提供同步脚本方便后续维护

## 文件结构

### 前端 (ui)

#### 组件
```
ui/src/components/data-browser/
├── data-table.tsx          # 表格视图组件
├── data-card-view.tsx      # 卡片视图组件
├── data-detail-dialog.tsx  # 详情对话框
├── data-sidebar.tsx        # 侧边栏导航
└── data-toolbar.tsx        # 工具栏
```

#### UI 组件
```
ui/src/components/ui/
├── media-preview.tsx       # 媒体预览组件
└── infinite-scroll.tsx     # 无限滚动组件
```

#### 类型定义
```
ui/src/types/
└── data.ts                 # 数据类型定义
```

#### API 调用层
```
ui/src/apis/
└── data-browser.ts         # 数据浏览器 API 调用
```

#### 页面
```
ui/src/pages/$teamId/data-browser/
└── index.lazy.tsx          # 数据浏览器主页面
```

### 后端 (src)

#### 模块
```
src/modules/data-browser/
├── data-browser.controller.ts  # 控制器（只读 API）
├── data-browser.service.ts     # 服务层
├── data-browser.module.ts      # 模块定义
└── dto/
    ├── data-asset.dto.ts       # 资产 DTO
    ├── data-view.dto.ts        # 视图 DTO
    └── index.ts                # DTO 导出
```

### 工具脚本

```
scripts/
└── sync-data-browser-components.sh  # 组件同步脚本
```

## 核心功能

### 后端 API

#### 路由前缀
- `/api/data-browser` - 用户级别的只读数据浏览接口

#### 主要接口

**视图管理**
- `GET /api/data-browser/views/tree` - 获取视图树形结构
- `GET /api/data-browser/views` - 获取视图列表
- `GET /api/data-browser/views/:id` - 获取视图详情

**资产管理**
- `GET /api/data-browser/assets` - 获取资产列表（只返回已发布）
- `GET /api/data-browser/assets/:id` - 获取资产详情（只返回已发布）

#### 权限控制

- **鉴权方式**：使用 `CompatibleAuthGuard`（用户级别 JWT 鉴权）
- **访问限制**：
  - 只能读取，不能创建/更新/删除
  - 只能访问已发布（`status: 'published'`）的资产
  - 自动过滤未发布内容

### 前端功能

#### 只读模式

数据浏览器页面通过不传递编辑相关的回调函数来实现只读模式：

```typescript
// 移除的功能
onEdit={undefined}          // 不显示编辑按钮
onDelete={undefined}        // 不显示删除按钮
onCreateCategory={undefined}  // 不显示创建视图
onUpdateCategory={undefined}  // 不显示更新视图
onDeleteCategory={undefined}  // 不显示删除视图
onExport={undefined}        // 不显示导出功能
onImport={undefined}        // 不显示导入功能
onBatchDelete={undefined}   // 不显示批量删除
onSelectionChange={undefined}  // 禁用选择功能
```

#### 保留功能

- ✅ 视图/分类浏览
- ✅ 数据列表查看（表格/卡片视图切换）
- ✅ 搜索和筛选
- ✅ 详情查看
- ✅ 无限滚动加载
- ✅ 数据刷新

## 使用方法

### 访问页面

```
https://your-domain.com/{teamId}/data-browser
```

### API 调用示例

```typescript
import { getDataList, getViewTree } from '@/apis/data-browser';

// 获取视图列表
const views = await getViewTree();

// 获取数据列表
const data = await getDataList({
  viewId: 'view-123',
  keyword: '搜索关键词',
  page: 1,
  pageSize: 20,
});
```

## 维护指南

### 同步组件更新

当 `ui-admin` 的数据管理组件更新后，使用同步脚本更新 `ui` 项目：

```bash
# 在项目根目录执行
./scripts/sync-data-browser-components.sh
```

脚本会自动同步：
1. 5个数据管理组件
2. 1个类型定义文件
3. 2个 UI 组件

### 手动同步步骤

如果需要手动同步：

1. **同步组件**
```bash
rsync -av --delete \
  ui-admin/src/components/admin/data/ \
  ui/src/components/data-browser/
```

2. **同步类型**
```bash
cp ui-admin/src/types/data.ts ui/src/types/data.ts
```

3. **同步 UI 组件**
```bash
cp ui-admin/src/components/ui/media-preview.tsx ui/src/components/ui/
cp ui-admin/src/components/ui/infinite-scroll.tsx ui/src/components/ui/
```

4. **检查页面**
确保 `ui/src/pages/$teamId/data-browser/index.lazy.tsx` 中的只读模式回调仍然正确

### 验证构建

**后端**：
```bash
yarn build
```

**前端（ui）**：
```bash
cd ui
yarn build
```

### 启动服务

**后端**：
```bash
yarn start:dev
# 或使用特定配置
yarn start -- --config config.bsd.yaml
```

**前端（ui）**：
```bash
cd ui
yarn dev
```

访问地址：`http://localhost:2048/{teamId}/data-browser`

## 注意事项

### 开发环境

- ui-admin: `http://localhost:3001/admin`
- ui: `http://localhost:2048/{teamId}/data-browser`

### 生产环境

- 两个项目独立部署在不同的 Pod
- Docker 构建时不共享源代码
- 必须通过同步脚本保持组件一致性

### 权限说明

- `/api/admin/*` - 仅管理员可访问（AdminJwtGuard）
- `/api/data-browser/*` - 所有登录用户可访问（CompatibleAuthGuard）
- 数据浏览器只能查看已发布的内容

### Git Hook（可选）

可以添加 git pre-commit hook 提醒同步：

```bash
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -q "ui-admin/src/components/admin/data/"; then
    echo "警告：检测到 ui-admin 数据管理组件的修改"
    echo "请记得运行 ./scripts/sync-data-browser-components.sh 同步到 ui 项目"
fi
```

## 后续优化建议

1. **CI/CD 集成**
   在 CI 流程中自动检测组件差异并提醒

2. **版本标记**
   在组件文件头部添加版本注释，便于追踪同步状态

3. **自动化测试**
   添加 E2E 测试确保只读模式正常工作

4. **组件发布**
   如果未来需要更多复用，考虑将组件发布为 npm 包

## 问题排查

### 组件导入错误

如果遇到组件导入错误，检查：
- 路径是否正确（`@/components/data-browser/`）
- 是否已同步最新的组件和类型文件
- UI 组件依赖是否完整

### API 调用失败

如果 API 调用失败，检查：
- 后端模块是否已注册到 `app.module.ts`
- 用户是否已登录（需要 JWT token）
- 数据是否已发布（只能访问 `status: 'published'` 的数据）

### 样式问题

如果样式异常，检查：
- Tailwind CSS 配置是否一致
- shadcn/ui 组件是否正确安装
- CSS 类名是否完整

## 总结

本实现通过复制组件和创建独立 API 的方式，在保持功能一致性的同时实现了：

✅ 完全独立的构建和部署
✅ 用户级别的只读权限控制
✅ 简单高效的维护流程
✅ 零依赖的跨项目复用

通过同步脚本，维护成本控制在最低水平。
