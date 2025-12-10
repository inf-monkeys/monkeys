# Vines Admin - 启动指南

## 项目已完成的内容

✅ **UI 组件** (shadcn/ui)
- Button, Input, Label, Card, Avatar
- DropdownMenu, Separator
- 所有组件基于 Radix UI + Tailwind CSS

✅ **认证系统** (预留 RBAC 支持)
- 类型定义：`UserRole`, `Permission`, `AdminUser`
- API 调用：登录、退出、获取当前用户
- Zustand Store：认证状态管理
- Hooks：`useAuth`, `useAuthGuard`
- LocalStorage 持久化

✅ **登录页面** (`/login`)
- 邮箱密码登录表单
- 错误提示和加载状态
- 响应式设计

✅ **管理后台布局**
- Sidebar 侧边栏导航（12个菜单项）
- Header 顶部栏（用户头像、下拉菜单、退出）
- AdminLayout 整体布局
- 路由守卫（未登录跳转）

✅ **Dashboard 首页** (`/admin`)
- 统计卡片（用户、团队、工具、工作流）
- 快速操作入口
- 最近活动和系统状态

## 快速启动

### 1. 安装依赖

```bash
cd /Users/leo/Workspace/monkeys/ui-admin
yarn install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件（可选，默认代理到 `http://localhost:3000`）：

```env
SERVER_ENDPOINT=http://localhost:3000
```

### 3. 启动开发服务器

```bash
yarn dev
```

访问 http://localhost:3048

## 项目结构

```
ui-admin/
├── src/
│   ├── pages/                  # 路由页面
│   │   ├── __root.tsx          # 根路由
│   │   ├── login.tsx           # 登录页 ✅
│   │   ├── admin.tsx           # Admin 布局路由 ✅
│   │   └── admin/
│   │       └── index.tsx       # Dashboard ✅
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件 ✅
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   │
│   │   └── layout/             # 布局组件 ✅
│   │       ├── admin-layout.tsx
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   │
│   ├── apis/                   # API 调用 ✅
│   │   └── auth.ts
│   │
│   ├── hooks/                  # React Hooks ✅
│   │   ├── use-auth.ts
│   │   └── use-auth-guard.ts
│   │
│   ├── store/                  # Zustand 状态 ✅
│   │   └── auth.ts
│   │
│   ├── types/                  # TypeScript 类型 ✅
│   │   └── auth.ts
│   │
│   └── lib/                    # 工具库 ✅
│       └── utils.ts
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 认证系统设计

### RBAC 角色定义

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',  // 超级管理员
  ADMIN = 'admin',               // 管理员
  MANAGER = 'manager',           // 管理者
  VIEWER = 'viewer',             // 查看者
}
```

### 权限定义（预留）

```typescript
enum Permission {
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  // ... 30+ 权限
}
```

### 权限检查方法

```typescript
const { hasRole, hasPermission, isSuperAdmin } = useAuth();

// 检查角色
if (hasRole(UserRole.ADMIN)) { /* ... */ }

// 检查权限
if (hasPermission(Permission.USER_WRITE)) { /* ... */ }

// 检查超级管理员
if (isSuperAdmin()) { /* ... */ }
```

## 后端 API 约定

前端已预留以下 API 接口（后端需要实现）：

### 认证接口

```
POST /api/admin/auth/login
  Body: { email, password }
  Response: { token, user }

POST /api/admin/auth/logout
  Response: { success }

GET /api/admin/auth/me
  Response: { user }

POST /api/admin/auth/refresh
  Response: { token, user }
```

### 响应格式

```typescript
// 用户信息
interface AdminUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  roles: UserRole[];              // 角色列表
  permissions?: Permission[];      // 权限列表
  isAdmin: boolean;
  createdTimestamp: number;
  lastLoginAt?: number;
}

// 登录响应
interface LoginResponse {
  token: string;  // JWT Token
  user: AdminUser;
}
```

### 认证方式

前端会在请求 Header 中携带 Token：

```
Authorization: Bearer <token>
```

## 下一步开发建议

### 1. 后端优先任务

创建 `/api/admin/*` 路由：

```typescript
// src/modules/admin/admin.module.ts
@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminGuard],
})
export class AdminModule {}

// src/modules/admin/auth/admin-auth.controller.ts
@Controller('admin/auth')
export class AdminAuthController {
  @Post('login')
  async login(@Body() dto: LoginDto) { /* ... */ }

  @Get('me')
  @UseGuards(AdminGuard)
  async getMe(@Request() req) { /* ... */ }
}
```

### 2. 前端扩展任务

可以继续添加管理页面：

- 用户管理 (`/admin/users`)
- 团队管理 (`/admin/teams`)
- 工具管理 (`/admin/tools`)
- 配置管理 (`/admin/config`)

## 技术栈版本

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.2.0 | 与 ui/ 相同 |
| TypeScript | 5.4.4 | 与 ui/ 相同 |
| Vite | 8.0.0-beta.0 | 与 ui/ 相同 |
| TanStack Router | 1.21.0 | 与 ui/ 相同 |
| Tailwind CSS | 3.4.3 | 与 ui/ 相同 |
| Zustand | 4.5.2 | 与 ui/ 相同 |
| SWR | 2.2.5 | 与 ui/ 相同 |
| shadcn/ui | 最新 | 新增 |
| Lucide React | 0.544.0 | 与 ui/ 相同 |

## 常见问题

### Q: 如何添加新的 shadcn/ui 组件？

```bash
npx shadcn-ui@latest add [component-name]
```

例如：
```bash
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

### Q: 如何添加新的菜单项？

编辑 [src/components/layout/sidebar.tsx](src/components/layout/sidebar.tsx:19)：

```typescript
const navItems: NavItem[] = [
  // ... 现有菜单
  {
    title: '新菜单',
    href: '/admin/new-page',
    icon: YourIcon,
  },
];
```

### Q: 如何检查用户权限？

```typescript
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@/types/auth';

function MyComponent() {
  const { hasPermission } = useAuth();

  if (!hasPermission(Permission.USER_WRITE)) {
    return <div>无权限</div>;
  }

  return <div>有权限的内容</div>;
}
```

## 测试账号（模拟）

开发时可以在登录页面使用任意邮箱密码（后端未实现时会报错）。

后端实现后的测试账号示例：

```
邮箱: admin@infmonkeys.com
密码: admin123
```

## 注意事项

⚠️ **重要**:
- 后端 API 尚未实现，前端会报错是正常的
- 认证系统已预留 RBAC 支持，后端实现时需要返回 `roles` 和 `permissions` 字段
- 所有 API 请求都会通过 Vite 代理到 `/api/*`
- Token 存储在 localStorage 中，刷新页面会自动恢复登录状态

## 部署

```bash
# 构建生产版本
yarn build

# 预览构建结果
yarn preview
```

构建产出在 `dist/` 目录。
