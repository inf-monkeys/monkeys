# Vines Admin - 管理后台前端

基于 React + TypeScript + TanStack Router + shadcn/ui 的现代化管理后台。

## 技术栈

- **框架**: React 18.2.0 + TypeScript 5.4.4
- **路由**: TanStack Router 1.21.0
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 3.4.3
- **状态管理**: Zustand 4.5.2
- **数据获取**: SWR 2.2.5
- **表格**: TanStack Table 8.15.3
- **表单**: React Hook Form 7.51.2 + Zod 4.1.8
- **图标**: Lucide React 0.544.0
- **构建工具**: Vite 8.0.0-beta.0

## 快速开始

```bash
# 安装依赖
yarn install

# 复制环境变量
cp .env.example .env

# 启动开发服务器 (端口 3048)
yarn dev

# 构建生产版本
yarn build
```

## 添加 shadcn/ui 组件

```bash
# 使用 shadcn CLI 添加组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
```

## 项目结构

```
ui-admin/
├── src/
│   ├── pages/              # TanStack Router 页面
│   │   ├── __root.tsx      # 根布局
│   │   └── admin/          # 管理后台路由
│   │
│   ├── components/         # 组件
│   │   └── ui/            # shadcn/ui 组件
│   │
│   ├── lib/               # 工具库
│   │   └── utils.ts       # cn() 工具函数
│   │
│   ├── apis/              # API 调用
│   ├── hooks/             # React Hooks
│   ├── store/             # Zustand 状态
│   └── types/             # TypeScript 类型
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 开发说明

### 后端 API

开发环境下，所有 `/api/*` 请求会代理到后端服务器（默认 `http://localhost:3000`）。

### 路由系统

使用 TanStack Router 的文件系统路由：
- `src/pages/admin/index.tsx` → `/admin`
- `src/pages/admin/users/index.tsx` → `/admin/users`

### 添加 shadcn/ui 组件

项目已配置好 shadcn/ui，可以直接使用 CLI 添加组件：

```bash
npx shadcn-ui@latest add [component-name]
```

组件会自动添加到 `src/components/ui/` 目录。

## 与主前端的关系

- **共享后端**: 使用同一个 NestJS 服务器 (`/api/admin/*` 路由)
- **独立项目**: 完全独立的前端项目
- **技术栈一致**: 与 ui/ 使用相同的核心版本
- **统一设计**: 使用 shadcn/ui 统一设计系统
