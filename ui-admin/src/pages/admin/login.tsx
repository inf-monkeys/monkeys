import { login } from '@/apis/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  formatAdminTitle,
  getBrandLogoUrl,
  getBrandTitle,
  useSystemConfigStore,
} from '@/store/system-config';

export const Route = createFileRoute('/admin/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const config = useSystemConfigStore((s) => s.config);
  const brandTitle = getBrandTitle(config);
  const adminTitle = formatAdminTitle(brandTitle);
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const logoUrl = getBrandLogoUrl(config, { darkMode: prefersDark });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('请输入邮箱和密码');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData);
      loginStore(result.token, result.user);
      toast.success('登录成功');
      navigate({ to: '/admin' });
    } catch (error: any) {
      toast.error(error.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg overflow-hidden ${
              logoUrl ? 'bg-transparent' : 'bg-primary text-primary-foreground'
            }`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandTitle}
                className="h-full w-full object-contain"
              />
            ) : (
              <LogIn className="h-8 w-8" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{adminTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {brandTitle} 管理后台
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>请输入您的管理员账号</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    登录
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2024 {brandTitle}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

