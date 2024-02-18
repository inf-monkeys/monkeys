# Vines UI - 组件目录规范

```
├─components
│  ├─ui         // 公共组件
│  │  └─button  // 节点名称
│  │     ├─index.tsx // 组件入口
│  │     └─utils.ts  // 组件工具函数
│  ├─layout     // 布局组件
│  │  ├─example-page1 // 页面
│  │  │  └─comp1      // 页面组件
│  │  │  │  ├─index.tsx // 组件入口
│  │  │  │  └─utils.ts  // 组件工具函数
│  │  └─home      // 页面
│  │     └─comp1  // 页面组件
│  │        ├─index.tsx // 组件入口
│  │        └─utils.ts  // 组件工具函数
│  └─router     // 路由相关组件     
```

## 组件命名

为保证组件统一和美观性，组件及目录命名规范如下：

- 组件目录名称使用小写字母，多个单词使用中划线连接，如：`button`、`date-picker`。
- 组件由 `index.tsx` 作为入口文件，`utils.ts` 作为工具函数文件（非必须）。
- 组件名称使用大驼峰命名法，如：`Button`、`DatePicker`。

导入示范：

```typescript jsx
import { Button } from '@/components/ui/button';
         ^              ^
         大驼峰命名      使用 @ 指向 src 目录
```

## 组件目录结构划分

- `ui` ：存放公共组件，如：`Button`、`Input` 等。
- `layout` ：存放各个页面布局组件。页面根目录下不应存在 `index.tsx`，而是存放于 `pages/` 目录下。
- `router` ：存放路由相关组件，如：`catch-boundary (错误边界)`、`404`。