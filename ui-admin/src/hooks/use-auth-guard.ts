import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';

export function useAuthGuard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    // 初始化时从 localStorage 恢复认证状态
    hydrate();
  }, []);

  useEffect(() => {
    // 如果加载完成且未认证，跳转到登录页
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
}
