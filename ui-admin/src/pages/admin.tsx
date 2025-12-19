import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    // /admin/login 允许匿名访问；其他 /admin 路由若无 token 则直接重定向，避免先渲染再跳转的闪烁
    if (typeof window === 'undefined') return;
    if (location.pathname.startsWith('/admin/login')) return;
    const token = window.localStorage.getItem('admin_token');
    if (!token) {
      throw redirect({ to: '/admin/login' });
    }
  },
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const router = useRouterState();
  const isLoginRoute = router.location.pathname.startsWith('/admin/login');

  // 始终调用 Hook，避免条件调用导致 hooks 数量不一致
  const { isLoading } = useAuthGuard({ enabled: !isLoginRoute });

  if (isLoginRoute) {
    return <Outlet />;
  }

  // 判断是否需要 flush 布局（无边距）
  const isFlushLayout =
    router.location.pathname.startsWith('/admin/data') ||
    router.location.pathname.startsWith('/admin/users') ||
    router.location.pathname.startsWith('/admin/permissions');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout flush={isFlushLayout}>
      <Outlet />
    </AdminLayout>
  );
}
