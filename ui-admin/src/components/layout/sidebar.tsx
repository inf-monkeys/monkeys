import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar';
import { Link, useRouterState } from '@tanstack/react-router';
import {
    Building2,
    ChevronDown,
    CreditCard,
    Database,
    FolderOpen,
    LayoutDashboard,
    Settings,
    Shield,
    Users,
    Workflow,
    Wrench,
} from 'lucide-react';
import { useState } from 'react';

import { formatAdminTitle, getBrandLogoUrl, getBrandTitle, useSystemConfigStore } from '@/store/system-config';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
  requiresSuperAdmin?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: '数据管理',
    href: '/admin/data',
    icon: Database,
  },
  {
    title: '权限管理',
    href: '/admin/permissions',
    icon: Shield,
    requiresSuperAdmin: true,
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
  const { isCollapsed } = useSidebarStore();
  const { isSuperAdmin } = useAuth();
  const showSuperAdminItems = isSuperAdmin();
  const config = useSystemConfigStore((s) => s.config);
  const brandTitle = getBrandTitle(config);
  const adminTitle = formatAdminTitle(brandTitle);
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const logoUrl = getBrandLogoUrl(config, { darkMode: prefersDark });
  const visibleNavItems = navItems.filter(
    (item) => !item.requiresSuperAdmin || showSuperAdminItems,
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex h-full flex-col border-r bg-background transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden',
                logoUrl ? 'bg-transparent' : 'bg-primary text-primary-foreground',
              )}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={brandTitle} className="h-full w-full object-contain" />
              ) : (
                <LayoutDashboard className="h-4 w-4" />
              )}
            </div>
            {!isCollapsed && (
              <span className="text-lg font-semibold whitespace-nowrap">
                {adminTitle}
              </span>
            )}
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {visibleNavItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* 底部信息 */}
        {!isCollapsed && (
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface NavItemProps {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
}

function NavItemComponent({ item, pathname, isCollapsed }: NavItemProps) {
  const isActive =
    item.href === '/admin'
      ? pathname === '/admin' || pathname === '/admin/'
      : pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;
  const [isExpanded, setIsExpanded] = useState(false);

  if (item.children) {
    const content = (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </>
          )}
        </button>
        {!isCollapsed && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavItemComponent
                key={child.href}
                item={child}
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
      </div>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  }

  const linkContent = (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.title}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
