import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getAdminDashboardRecentUsers, getAdminDashboardStats } from '@/apis/dashboard';
import type { AdminDashboardMetric, AdminDashboardRecentUser } from '@/types/dashboard';
import { Permission } from '@/types/auth';
import {
  Users,
  Building2,
  Wrench,
  Workflow,
  TrendingDown,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Route = createFileRoute('/admin/')({
  component: Dashboard,
});

function Dashboard() {
  const { user, hasPermission } = useAuth();
  const canViewUsers = hasPermission(Permission.USER_READ);

  const [stats, setStats] = useState<{
    users: AdminDashboardMetric | null;
    teams: AdminDashboardMetric | null;
    tools: AdminDashboardMetric | null;
    workflows: AdminDashboardMetric | null;
  }>({ users: null, teams: null, tools: null, workflows: null });

  const [recentUsers, setRecentUsers] = useState<AdminDashboardRecentUser[]>([]);
  const [isRecentUsersLoading, setIsRecentUsersLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    void (async () => {
      try {
        const result = await getAdminDashboardStats();
        if (isCancelled) return;
        setStats(result);
      } catch (e: any) {
        if (isCancelled) return;
        toast.error(e?.message || '加载统计数据失败');
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (!canViewUsers) {
      setRecentUsers([]);
      setIsRecentUsersLoading(false);
      return;
    }

    setIsRecentUsersLoading(true);
    void (async () => {
      try {
        if (isCancelled) return;
        const list = await getAdminDashboardRecentUsers();
        if (isCancelled) return;
        setRecentUsers(list);
      } catch (e: any) {
        if (isCancelled) return;
        toast.error(e?.message || '加载最近用户失败');
      } finally {
        if (isCancelled) return;
        setIsRecentUsersLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [canViewUsers]);

  const statCards = useMemo(() => {
    const formatNumber = (value: number | null) =>
      value === null ? '—' : new Intl.NumberFormat('zh-CN').format(value);

    const formatChange = (value: number | null) => {
      if (value === null) return '—';
      const abs = Math.abs(value);
      const pct = `${abs.toFixed(1)}%`;
      return value >= 0 ? `+${pct}` : `-${pct}`;
    };

    const resolveTrend = (metric: AdminDashboardMetric | null) => {
      if (!metric) return { icon: Activity, className: 'text-muted-foreground', change: '—' };
      if (metric.trend === 'up') {
        return { icon: TrendingUp, className: 'text-green-600', change: formatChange(metric.changePct) };
      }
      if (metric.trend === 'down') {
        return { icon: TrendingDown, className: 'text-red-600', change: formatChange(metric.changePct) };
      }
      return { icon: Activity, className: 'text-muted-foreground', change: formatChange(metric.changePct) };
    };

    return [
      {
        title: '用户总数',
        value: formatNumber(stats.users?.total ?? null),
        trend: resolveTrend(stats.users),
        icon: Users,
        href: '/admin/users',
      },
      {
        title: '团队总数',
        value: formatNumber(stats.teams?.total ?? null),
        trend: resolveTrend(stats.teams),
        icon: Building2,
        href: '/admin/teams',
      },
      {
        title: '工具数量',
        value: formatNumber(stats.tools?.total ?? null),
        trend: resolveTrend(stats.tools),
        icon: Wrench,
        href: '/admin/tools',
      },
      {
        title: '工作流',
        value: formatNumber(stats.workflows?.total ?? null),
        trend: resolveTrend(stats.workflows),
        icon: Workflow,
        href: '/admin/workflows',
      },
    ];
  }, [stats]);

  // 快速操作
  const quickActions = [
    {
      title: '创建用户',
      description: '添加新的管理员或用户',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: '创建团队',
      description: '创建新的团队组织',
      icon: Building2,
      href: '/admin/teams',
    },
    {
      title: '管理工具',
      description: '配置和管理系统工具',
      icon: Wrench,
      href: '/admin/tools',
    },
    {
      title: '全局配置',
      description: '系统设置和参数配置',
      icon: Activity,
      href: '/admin/config',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎信息 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回来, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          这是您的管理后台控制面板
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend.icon;
          return (
            <Link key={stat.title} to={stat.href}>
              <Card className="transition-all hover:shadow-md cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendIcon className={`mr-1 h-3 w-3 ${stat.trend.className}`} />
                    <span className={stat.trend.className}>{stat.trend.change}</span>
                    <span className="ml-1">较上月</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用的管理功能入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <div className="group flex flex-col gap-2 rounded-lg border p-4 transition-all hover:border-primary hover:shadow-sm cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 最近活动 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近用户</CardTitle>
            <CardDescription>最新注册的用户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!canViewUsers ? (
                <div className="py-6 text-sm text-muted-foreground">
                  您暂时无法查看
                </div>
              ) : isRecentUsersLoading ? (
                <div className="py-6 text-sm text-muted-foreground">加载中...</div>
              ) : recentUsers.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">暂无用户</div>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.photo} alt={u.name} />
                      <AvatarFallback>
                        {(u.name || 'U').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name || '-'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email || '-'}
                      </p>
                    </div>
                    <Link to="/admin/users">
                      <Button variant="ghost" size="sm">
                        查看
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>服务运行状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'API 服务', status: '正常' },
                { name: '数据库', status: '正常' },
                { name: 'Redis', status: '正常' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <span className="text-sm">{service.name}</span>
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
