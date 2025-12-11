import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { logout as apiLogout } from '@/apis/auth';
import { toast } from 'sonner';
import { useSidebarStore } from '@/store/sidebar';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggle } = useSidebarStore();

  const handleLogout = async () => {
    try {
      await apiLogout();
      logout();
      toast.success('已退出登录');
      navigate({ to: '/login' });
    } catch (error: any) {
      toast.error(error.message || '退出失败');
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle 按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          {/* 可以添加搜索框或面包屑导航 */}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photo} alt={user?.name} />
                <AvatarFallback>
                  {user?.name ? getUserInitials(user.name) : 'AD'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
