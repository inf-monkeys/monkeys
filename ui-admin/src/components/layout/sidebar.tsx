import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  Workflow,
  CreditCard,
  FolderOpen,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '用户管理',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: '团队管理',
    href: '/admin/teams',
    icon: Building2,
  },
  {
    title: '工具管理',
    href: '/admin/tools',
    icon: Wrench,
  },
  {
    title: '工作流管理',
    href: '/admin/workflows',
    icon: Workflow,
  },
  {
    title: '计费管理',
    href: '/admin/pricing',
    icon: CreditCard,
    children: [
      { title: '余额管理', href: '/admin/pricing/balances', icon: CreditCard },
      { title: '订单管理', href: '/admin/pricing/orders', icon: CreditCard },
      { title: '消费记录', href: '/admin/pricing/consume', icon: CreditCard },
      { title: '充值记录', href: '/admin/pricing/recharge', icon: CreditCard },
    ],
  },
  {
    title: '资产管理',
    href: '/admin/assets',
    icon: FolderOpen,
  },
  {
    title: '全局配置',
    href: '/admin/config',
    icon: Settings,
  },
];

export function Sidebar() {
  const router = useRouterState();
  const pathname = router.location.pathname;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Monkeys Admin</span>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavItemComponent key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}

interface NavItemProps {
  item: NavItem;
  pathname: string;
}

function NavItemComponent({ item, pathname }: NavItemProps) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.title}</span>
          <ChevronRight className={cn(
            'h-4 w-4 transition-transform',
            isActive && 'rotate-90'
          )} />
        </div>
        {isActive && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavItemComponent key={child.href} item={child} pathname={pathname} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.title}</span>
      {item.badge && (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
