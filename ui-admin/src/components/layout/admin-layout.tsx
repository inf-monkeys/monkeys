import { Sidebar } from './sidebar';
import { Header } from './header';

interface AdminLayoutProps {
  children: React.ReactNode;
  /** 是否使用无边距布局（适用于表格等全屏内容） */
  flush?: boolean;
}

export function AdminLayout({ children, flush = false }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部栏 */}
        <Header />

        {/* 内容 */}
        <main className="flex-1 overflow-y-auto bg-background">
          {flush ? (
            children
          ) : (
            <div className="container mx-auto p-6">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
