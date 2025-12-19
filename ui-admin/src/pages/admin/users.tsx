import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  createAdminAccount,
  deleteAdminAccount,
  listAdminAccounts,
  resetAdminAccountPassword,
  updateAdminAccount,
} from "@/apis/admin-users";
import { createUser, deleteUser, listUsers, resetUserPassword, updateUser } from "@/apis/users";
import { useAuth } from "@/hooks/use-auth";
import { Permission, UserRole } from "@/types/auth";
import type {
  AdminAccount,
  CreateAdminAccountInput,
  CreateUserInput,
  UpdateAdminAccountInput,
  UpdateUserInput,
  User,
} from "@/types/user-management";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/users")({
  component: UsersManagementPage,
});

type ManagementTableHandle = {
  applySearch: (keyword: string) => void;
  openCreate: () => void;
};

function UsersManagementPage() {
  const { hasAnyRole, isSuperAdmin, hasPermission } = useAuth();

  const canAccess = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  const showAdminAccountsTab = isSuperAdmin();

  const canReadUsers = hasPermission(Permission.USER_READ);
  const canWriteUsers = hasPermission(Permission.USER_WRITE);
  const canDeleteUsers = hasPermission(Permission.USER_DELETE);

  const canReadAdmins = hasPermission(Permission.ADMIN_READ);
  const canWriteAdmins = hasPermission(Permission.ADMIN_WRITE);
  const canDeleteAdmins = hasPermission(Permission.ADMIN_DELETE);

  const [tab, setTab] = useState<"users" | "admin-users">("users");
  const userTableRef = useRef<ManagementTableHandle | null>(null);
  const adminTableRef = useRef<ManagementTableHandle | null>(null);

  const [userKeywordInput, setUserKeywordInput] = useState("");
  const [adminKeywordInput, setAdminKeywordInput] = useState("");

  const keywordInput = tab === "users" ? userKeywordInput : adminKeywordInput;
  const setKeywordInput = tab === "users" ? setUserKeywordInput : setAdminKeywordInput;

  useEffect(() => {
    if (!showAdminAccountsTab && tab === "admin-users") {
      setTab("users");
    }
  }, [showAdminAccountsTab, tab]);

  useEffect(() => {
    if (tab === "users" && !canReadUsers && showAdminAccountsTab && canReadAdmins) {
      setTab("admin-users");
      return;
    }
    if (tab === "admin-users" && (!showAdminAccountsTab || !canReadAdmins)) {
      setTab("users");
    }
  }, [tab, canReadUsers, canReadAdmins, showAdminAccountsTab]);

  const triggerSearch = () => {
    const keyword = keywordInput.trim();
    if (tab === "users") {
      if (!canReadUsers) return;
      userTableRef.current?.applySearch(keyword);
      return;
    }
    if (!canReadAdmins) return;
    adminTableRef.current?.applySearch(keyword);
  };

  const triggerCreate = () => {
    if (tab === "users") {
      if (!canWriteUsers) return;
      userTableRef.current?.openCreate();
      return;
    }
    if (!canWriteAdmins) return;
    adminTableRef.current?.openCreate();
  };

  if (!canAccess) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h1 className="text-xl font-semibold">无权限</h1>
        <p className="mt-2 text-sm text-muted-foreground">当前账号无权访问用户管理</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            {canReadUsers ? <TabsTrigger value="users">用户管理</TabsTrigger> : null}
            {showAdminAccountsTab && canReadAdmins ? <TabsTrigger value="admin-users">管理员管理</TabsTrigger> : null}
          </TabsList>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input
              placeholder={tab === "users" ? "搜索 name/email/phone/nickname" : "搜索 username/name/email"}
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") triggerSearch();
              }}
              className="w-full sm:w-96"
              disabled={tab === "users" ? !canReadUsers : !canReadAdmins}
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={triggerSearch}>
                搜索
              </Button>
              {tab === "users" ? (
                canWriteUsers ? (
                  <Button onClick={triggerCreate}>创建用户</Button>
                ) : null
              ) : canWriteAdmins ? (
                <Button onClick={triggerCreate}>创建管理员</Button>
              ) : null}
            </div>
          </div>
        </div>

        <TabsContent value="users" className="mt-4 flex min-h-0 flex-1 flex-col">
          {canReadUsers ? (
            <UserTable ref={userTableRef} canWrite={canWriteUsers} canDelete={canDeleteUsers} />
          ) : (
            <div className="rounded-lg border p-8 text-center">
              <h2 className="text-lg font-semibold">无权限</h2>
              <p className="mt-2 text-sm text-muted-foreground">当前账号无权查看用户列表</p>
            </div>
          )}
        </TabsContent>

        {showAdminAccountsTab ? (
          <TabsContent value="admin-users" className="mt-4 flex min-h-0 flex-1 flex-col">
            {canReadAdmins ? (
              <AdminAccountTable
                ref={adminTableRef}
                canWrite={canWriteAdmins}
                canDelete={canDeleteAdmins}
              />
            ) : (
              <div className="rounded-lg border p-8 text-center">
                <h2 className="text-lg font-semibold">无权限</h2>
                <p className="mt-2 text-sm text-muted-foreground">当前账号无权查看管理员列表</p>
              </div>
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

const UserTable = forwardRef<ManagementTableHandle, { canWrite: boolean; canDelete: boolean }>(function UserTable(props, ref) {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editing, setEditing] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{
    title: string;
    account: { email: string; name: string };
    password: string;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await listUsers({ page, pageSize, keyword });
      setItems(res.list);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e.message || "加载用户失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, keyword]);

  const applySearch = (value: string) => {
    const next = value.trim();

    if (page === 1 && next === keyword) {
      void load();
      return;
    }

    setPage(1);
    setKeyword(next);
  };

  const openCreate = () => setIsCreateOpen(true);

  useImperativeHandle(ref, () => ({
    applySearch,
    openCreate: () => {
      if (!props.canWrite) return;
      openCreate();
    },
  }));

  const onCreate = async (data: Omit<CreateUserInput, "password">) => {
    const password = generateRandomPassword();
    try {
      const user = await createUser({ ...data, password });
      toast.success("创建成功");
      setIsCreateOpen(false);
      setPasswordDialog({
        title: "用户已创建",
        account: { email: user.email, name: user.name },
        password,
      });
      setPage(1);
      await load();
    } catch (e: any) {
      toast.error(e.message || "创建失败");
    }
  };

  const onUpdate = async (id: string, data: UpdateUserInput) => {
    try {
      await updateUser(id, data);
      toast.success("保存成功");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success("删除成功");
      setPage(1);
      await load();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const onResetPassword = async (user: User) => {
    const password = generateRandomPassword();
    try {
      await resetUserPassword(user.id, password);
      toast.success("密码已重置");
      setPasswordDialog({
        title: "用户密码已重置",
        account: { email: user.email, name: user.name },
        password,
      });
    } catch (e: any) {
      toast.error(e.message || "重置失败");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border overflow-hidden">
        <div className="min-h-0 flex-1">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>昵称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{u.email}</span>
                      {!u.verified ? (
                        <Badge variant="secondary">未验证</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{u.phone || "-"}</TableCell>
                  <TableCell>{u.nickname || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={u.isBlocked ? "destructive" : "outline"}>
                        {u.isBlocked ? "已拉黑" : "正常"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{u.lastLoginAt ? formatTime(u.lastLoginAt) : "-"}</TableCell>
                  <TableCell>{formatTime(u.createdTimestamp)}</TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      canEdit={props.canWrite}
                      canResetPassword={props.canWrite}
                      canDelete={props.canDelete}
                      onEdit={() => setEditing(u)}
                      onResetPassword={() => void onResetPassword(u)}
                      onDelete={() => void onDelete(u.id)}
                      deleteTitle="删除用户"
                      deleteDescription={`确认删除用户 ${u.email} 吗？该操作为软删除。`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        <div className="flex flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-[240px] whitespace-nowrap text-base text-muted-foreground">
            共 {total} 条 · 第 {page} / {totalPages} 页
          </div>
          <SimplePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <UserEditDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => void onCreate(data)}
      />

      {editing ? (
        <UserEditDialog
          mode="edit"
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          initial={editing}
          onSubmit={(data) => void onUpdate(editing.id, data)}
        />
      ) : null}

      <PasswordDialog
        open={!!passwordDialog}
        onOpenChange={(open) => {
          if (!open) setPasswordDialog(null);
        }}
        title={passwordDialog?.title || ""}
        accountLabel={`${passwordDialog?.account?.name ?? ""} (${passwordDialog?.account?.email ?? ""})`}
        password={passwordDialog?.password || ""}
      />
    </div>
  );
});

const AdminAccountTable = forwardRef<ManagementTableHandle, { canWrite: boolean; canDelete: boolean }>(function AdminAccountTable(props, ref) {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{
    title: string;
    account: { email: string; name: string; username: string };
    password: string;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await listAdminAccounts({ page, pageSize, keyword });
      setItems(res.list);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e.message || "加载管理员失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, keyword]);

  const applySearch = (value: string) => {
    const next = value.trim();

    if (page === 1 && next === keyword) {
      void load();
      return;
    }

    setPage(1);
    setKeyword(next);
  };

  const openCreate = () => setIsCreateOpen(true);

  useImperativeHandle(ref, () => ({
    applySearch,
    openCreate: () => {
      if (!props.canWrite) return;
      openCreate();
    },
  }));

  const onCreate = async (data: Omit<CreateAdminAccountInput, "password">) => {
    const password = generateRandomPassword();
    try {
      const account = await createAdminAccount({ ...data, password });
      toast.success("创建成功");
      setIsCreateOpen(false);
      setPasswordDialog({
        title: "管理员已创建",
        account: {
          email: account.email,
          name: account.name,
          username: account.username,
        },
        password,
      });
      setPage(1);
      await load();
    } catch (e: any) {
      toast.error(e.message || "创建失败");
    }
  };

  const onUpdate = async (id: string, data: UpdateAdminAccountInput) => {
    try {
      await updateAdminAccount(id, data);
      toast.success("保存成功");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteAdminAccount(id);
      toast.success("删除成功");
      setPage(1);
      await load();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const onResetPassword = async (account: AdminAccount) => {
    const password = generateRandomPassword();
    try {
      await resetAdminAccountPassword(account.id, password);
      toast.success("密码已重置");
      setPasswordDialog({
        title: "管理员密码已重置",
        account: {
          email: account.email,
          name: account.name,
          username: account.username,
        },
        password,
      });
    } catch (e: any) {
      toast.error(e.message || "重置失败");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border overflow-hidden">
        <div className="min-h-0 flex-1">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-[80px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "启用" : "停用"}</Badge>
                  </TableCell>
                  <TableCell>{u.lastLoginAt ? formatTime(u.lastLoginAt) : "-"}</TableCell>
                  <TableCell>{formatTime(u.createdTimestamp)}</TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      canEdit={props.canWrite}
                      canResetPassword={props.canWrite}
                      canDelete={props.canDelete}
                      onEdit={() => setEditing(u)}
                      onResetPassword={() => void onResetPassword(u)}
                      onDelete={() => void onDelete(u.id)}
                      deleteTitle="删除管理员"
                      deleteDescription={`确认删除管理员 ${u.email || u.username} 吗？该操作为软删除。`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        <div className="flex flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-[240px] whitespace-nowrap text-base text-muted-foreground">
            共 {total} 条 · 第 {page} / {totalPages} 页
          </div>
          <SimplePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <AdminAccountEditDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => void onCreate(data)}
      />

      {editing ? (
        <AdminAccountEditDialog
          mode="edit"
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          initial={editing}
          onSubmit={(data) => void onUpdate(editing.id, data)}
        />
      ) : null}

      <PasswordDialog
        open={!!passwordDialog}
        onOpenChange={(open) => {
          if (!open) setPasswordDialog(null);
        }}
        title={passwordDialog?.title || ""}
        accountLabel={`${passwordDialog?.account?.name ?? ""} (${passwordDialog?.account?.email ?? ""})`}
        password={passwordDialog?.password || ""}
        extraLabel={passwordDialog?.account?.username}
      />
    </div>
  );
});

function RowActions(props: {
  canEdit: boolean;
  canResetPassword: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  deleteTitle: string;
  deleteDescription: string;
}) {
  const hasAnyAction = props.canEdit || props.canResetPassword || props.canDelete;
  if (!hasAnyAction) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        {props.canEdit ? <DropdownMenuItem onClick={props.onEdit}>编辑</DropdownMenuItem> : null}
        {props.canResetPassword ? (
          <DropdownMenuItem onClick={props.onResetPassword}>重置密码</DropdownMenuItem>
        ) : null}
        {props.canDelete ? (
          <>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  删除
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{props.deleteTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{props.deleteDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={props.onDelete}
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type UserDialogProps =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onSubmit: (data: Omit<CreateUserInput, "password">) => void;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      initial: User;
      onSubmit: (data: UpdateUserInput) => void;
    };

function UserEditDialog(props: UserDialogProps) {
  const isEdit = props.mode === "edit";
  const initial = props.mode === "edit" ? props.initial : undefined;
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [nickname, setNickname] = useState(initial?.nickname || "");
  const [verified, setVerified] = useState(!!initial?.verified);
  const [isBlocked, setIsBlocked] = useState(!!initial?.isBlocked);

  useEffect(() => {
    if (!props.open) return;
    const next = props.mode === "edit" ? props.initial : undefined;
    setName(next?.name || "");
    setEmail(next?.email || "");
    setPhone(next?.phone || "");
    setNickname(next?.nickname || "");
    setVerified(!!next?.verified);
    setIsBlocked(!!next?.isBlocked);
  }, [props.open, props.mode, props.mode === "edit" ? props.initial : undefined]);

  const canSubmit = useMemo(() => {
    return name.trim() !== "" && email.trim() !== "";
  }, [name, email]);

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("请填写 name 与 email");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      nickname: nickname.trim() || undefined,
      verified,
      isBlocked,
    };

    if (props.mode === "create") {
      props.onSubmit(payload);
    } else {
      props.onSubmit(payload);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑用户" : "创建用户"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改用户资料（不会修改密码）" : "创建后将生成随机密码，请及时复制保存"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>姓名</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>邮箱</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>手机号（可选）</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>昵称（可选）</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={verified} onCheckedChange={(v) => setVerified(!!v)} />
              已验证
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isBlocked} onCheckedChange={(v) => setIsBlocked(!!v)} />
              拉黑
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isEdit ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AdminAccountDialogProps =
  | {
      mode: "create";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      onSubmit: (data: Omit<CreateAdminAccountInput, "password">) => void;
    }
  | {
      mode: "edit";
      open: boolean;
      onOpenChange: (open: boolean) => void;
      initial: AdminAccount;
      onSubmit: (data: UpdateAdminAccountInput) => void;
    };

function AdminAccountEditDialog(props: AdminAccountDialogProps) {
  const isEdit = props.mode === "edit";
  const initial = props.mode === "edit" ? props.initial : undefined;
  const [username, setUsername] = useState(initial?.username || "");
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  useEffect(() => {
    if (!props.open) return;
    const next = props.mode === "edit" ? props.initial : undefined;
    setUsername(next?.username || "");
    setName(next?.name || "");
    setEmail(next?.email || "");
    setIsActive(next?.isActive ?? true);
  }, [props.open, props.mode, props.mode === "edit" ? props.initial : undefined]);

  const canSubmit = useMemo(() => {
    return username.trim() !== "" && name.trim() !== "" && email.trim() !== "";
  }, [username, name, email]);

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("请填写 username/name/email");
      return;
    }

    if (isEdit) {
      props.onSubmit({
        username: username.trim(),
        name: name.trim(),
        email: email.trim(),
        isActive,
      });
      return;
    }

    props.onSubmit({
      username: username.trim(),
      name: name.trim(),
      email: email.trim(),
    });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑管理员" : "创建管理员"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改管理员资料（不会修改密码）" : "创建后将生成随机密码，请及时复制保存"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>用户名</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>姓名</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>邮箱</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {isEdit ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
              启用
            </label>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isEdit ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  accountLabel: string;
  password: string;
  extraLabel?: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.password);
      toast.success("已复制密码");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>请及时复制保存密码（仅展示一次）</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            <div className="text-muted-foreground">账号</div>
            <div className="font-medium">
              {props.accountLabel}
              {props.extraLabel ? <span className="ml-2 text-muted-foreground">· {props.extraLabel}</span> : null}
            </div>
          </div>
          <div className="rounded-md border bg-muted p-3 font-mono text-sm">{props.password}</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={() => void copy()}>复制密码</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimplePagination(props: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  const { page, totalPages } = props;
  const pages = useMemo(() => {
    const result: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p++) result.push(p);
    return result;
  }, [page, totalPages]);

  const goto = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    props.onPageChange(p);
  };

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              goto(page - 1);
            }}
          />
        </PaginationItem>
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              isActive={p === page}
              onClick={(e) => {
                e.preventDefault();
                goto(p);
              }}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              goto(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function toTimestamp(ts: unknown): number | null {
  if (ts === null || ts === undefined) return null;
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  if (typeof ts === "string") {
    const value = ts.trim();
    if (!value) return null;
    if (/^\d+$/.test(value)) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatTime(ts: unknown): string {
  try {
    const ms = toTimestamp(ts);
    if (ms === null) return "-";
    return format(new Date(ms), "yyyy-MM-dd HH:mm");
  } catch {
    return "-";
  }
}

function generateRandomPassword(): string {
  const length = 16;
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const randomInt = (maxExclusive: number) => {
    if (maxExclusive <= 0) return 0;
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      return buffer[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  };

  const pick = (s: string) => s[randomInt(s.length)];

  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < length) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
