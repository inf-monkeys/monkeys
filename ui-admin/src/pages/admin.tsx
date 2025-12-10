import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export const Route = createFileRoute('/admin')({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const { isLoading } = useAuthGuard();

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
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
