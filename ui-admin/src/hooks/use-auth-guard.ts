import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';

export function useAuthGuard(options?: { enabled?: boolean }) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    // 初始化时从 localStorage 恢复认证状态
    hydrate();
  }, []);

  useEffect(() => {
    // 如果加载完成且未认证，跳转到登录页
    if (enabled && !isLoading && !isAuthenticated) {
      navigate({ to: '/admin/login' });
    }
  }, [enabled, isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
}
