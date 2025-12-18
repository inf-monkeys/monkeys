import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createAdminRole,
  deleteAdminRole,
  listAdminPermissions,
  listAdminRoles,
  setAdminRolePermissions,
  updateAdminRole,
} from "@/apis/rbac";
import { useAuth } from "@/hooks/use-auth";
import type {
  AdminPermission,
  AdminRole,
  CreateAdminRoleInput,
  UpdateAdminRoleInput,
} from "@/types/rbac-management";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/permissions")({
  component: PermissionsManagementPage,
});

function PermissionsManagementPage() {
  const { isSuperAdmin } = useAuth();
  const canAccess = isSuperAdmin();

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [roleKeyword, setRoleKeyword] = useState("");
  const [permissionKeyword, setPermissionKeyword] = useState("");

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [originalPermissionIds, setOriginalPermissionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [isSaving, setIsSaving] = useState(false);

  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [createRoleForm, setCreateRoleForm] = useState<CreateAdminRoleInput>({
    code: "",
    name: "",
    description: "",
  });
  const [editRoleForm, setEditRoleForm] = useState<UpdateAdminRoleInput>({
    code: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!canAccess) return;

    setIsLoading(true);
    Promise.all([listAdminRoles(), listAdminPermissions()])
      .then(([roleList, permissionList]) => {
        setRoles(roleList);
        setPermissions(permissionList);
        setSelectedRoleId((prev) => prev ?? roleList[0]?.id ?? null);
      })
      .catch((err: any) => {
        toast.error(err?.message || "加载失败");
      })
      .finally(() => setIsLoading(false));
  }, [canAccess]);

  useEffect(() => {
    if (!selectedRole) return;
    const ids = new Set((selectedRole.permissions || []).map((p) => p.id));
    setSelectedPermissionIds(ids);
    setOriginalPermissionIds(new Set(ids));
  }, [selectedRoleId, selectedRole?.updatedTimestamp]);

  const filteredRoles = useMemo(() => {
    const keyword = roleKeyword.trim().toLowerCase();
    if (!keyword) return roles;
    return roles.filter((r) => {
      return (
        r.name.toLowerCase().includes(keyword) ||
        r.code.toLowerCase().includes(keyword)
      );
    });
  }, [roles, roleKeyword]);

  const filteredPermissions = useMemo(() => {
    const keyword = permissionKeyword.trim().toLowerCase();
    if (!keyword) return permissions;
    return permissions.filter((p) => {
      const haystack = `${p.code} ${p.name} ${p.resource} ${p.action} ${p.description || ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [permissions, permissionKeyword]);

  const isDirty = useMemo(() => {
    if (selectedPermissionIds.size !== originalPermissionIds.size) return true;
    for (const id of selectedPermissionIds) {
      if (!originalPermissionIds.has(id)) return true;
    }
    return false;
  }, [selectedPermissionIds, originalPermissionIds]);

  const allVisibleSelected = useMemo(() => {
    if (filteredPermissions.length === 0) return false;
    return filteredPermissions.every((p) => selectedPermissionIds.has(p.id));
  }, [filteredPermissions, selectedPermissionIds]);

  const anyVisibleSelected = useMemo(() => {
    return filteredPermissions.some((p) => selectedPermissionIds.has(p.id));
  }, [filteredPermissions, selectedPermissionIds]);

  const togglePermission = (id: string, checked: boolean) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllVisiblePermissions = (checked: boolean) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredPermissions.forEach((p) => next.add(p.id));
      } else {
        filteredPermissions.forEach((p) => next.delete(p.id));
      }
      return next;
    });
  };

  const refreshRoles = async (keepSelectedId?: string | null) => {
    const roleList = await listAdminRoles();
    setRoles(roleList);
    setSelectedRoleId((prev) => keepSelectedId ?? prev ?? roleList[0]?.id ?? null);
  };

  const openEditRole = () => {
    if (!selectedRole) return;
    setEditRoleForm({
      code: selectedRole.code,
      name: selectedRole.name,
      description: selectedRole.description || "",
    });
    setIsEditRoleOpen(true);
  };

  const handleCreateRole = async () => {
    const code = createRoleForm.code.trim();
    const name = createRoleForm.name.trim();
    const description = createRoleForm.description?.trim();

    if (!code || !name) {
      toast.error("code/name 为必填");
      return;
    }

    try {
      const created = await createAdminRole({
        code,
        name,
        description: description || undefined,
      });
      toast.success("角色已创建");
      setIsCreateRoleOpen(false);
      setCreateRoleForm({ code: "", name: "", description: "" });
      await refreshRoles(created.id);
    } catch (err: any) {
      toast.error(err?.message || "创建失败");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    const code = editRoleForm.code?.trim();
    const name = editRoleForm.name?.trim();
    const description = editRoleForm.description?.trim();

    if (!code || !name) {
      toast.error("code/name 为必填");
      return;
    }

    try {
      const updated = await updateAdminRole(selectedRole.id, {
        code,
        name,
        description: description || undefined,
      });
      toast.success("角色已更新");
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setIsEditRoleOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "更新失败");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteAdminRole(selectedRole.id);
      toast.success("角色已删除");
      const nextSelected = roles.find((r) => r.id !== selectedRole.id)?.id ?? null;
      setSelectedRoleId(nextSelected);
      await refreshRoles(nextSelected);
    } catch (err: any) {
      toast.error(err?.message || "删除失败");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const updated = await setAdminRolePermissions(
        selectedRole.id,
        Array.from(selectedPermissionIds)
      );
      toast.success("权限已保存");
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setOriginalPermissionIds(new Set(Array.from(selectedPermissionIds)));
    } catch (err: any) {
      toast.error(err?.message || "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h1 className="text-xl font-semibold">无权限</h1>
        <p className="mt-2 text-sm text-muted-foreground">仅超级管理员可访问权限管理</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">权限管理</h1>

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex min-h-0 flex-col gap-3 rounded-lg border bg-card p-4 lg:w-80">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">角色</h2>
            <Button size="sm" onClick={() => setIsCreateRoleOpen(true)}>
              创建角色
            </Button>
          </div>

          <Input
            placeholder="搜索角色 code/name"
            value={roleKeyword}
            onChange={(e) => setRoleKeyword(e.target.value)}
          />

          <ScrollArea className="min-h-0 flex-1 pr-2">
            <div className="space-y-1">
              {filteredRoles.map((role) => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{role.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{role.code}</div>
                      </div>
                      {role.isSystem ? (
                        <Badge variant="secondary" className="shrink-0">
                          系统
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })}

              {!isLoading && filteredRoles.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  暂无角色
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">
                  {selectedRole ? selectedRole.name : "权限"}
                </h2>
                {selectedRole ? (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {selectedRole.code}
                  </Badge>
                ) : null}
              </div>
              {selectedRole?.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{selectedRole.description}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={openEditRole}
                disabled={!selectedRole}
              >
                编辑角色
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={!selectedRole || !!selectedRole?.isSystem}
                  >
                    删除角色
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除角色？</AlertDialogTitle>
                    <AlertDialogDescription>
                      删除后该角色将不可用，已绑定到该角色的权限关系会被保留但不会再生效。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRole}>
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="搜索 code/name/resource/action"
              value={permissionKeyword}
              onChange={(e) => setPermissionKeyword(e.target.value)}
              className="w-full sm:w-96"
            />

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm font-medium text-muted-foreground whitespace-nowrap">
                已选 {selectedPermissionIds.size} / {permissions.length}
              </div>
              <Button
                onClick={handleSavePermissions}
                disabled={!selectedRole || !isDirty || isSaving}
              >
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : anyVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(v) => toggleAllVisiblePermissions(!!v)}
                      aria-label="选择全部可见权限"
                      disabled={!selectedRole || filteredPermissions.length === 0}
                    />
                  </TableHead>
                  <TableHead>code</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>resource</TableHead>
                  <TableHead>action</TableHead>
                  <TableHead>描述</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((perm) => {
                  const checked = selectedPermissionIds.has(perm.id);
                  return (
                    <TableRow key={perm.id}>
                      <TableCell className="w-12">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => togglePermission(perm.id, !!v)}
                          aria-label={`选择权限 ${perm.code}`}
                          disabled={!selectedRole}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{perm.code}</TableCell>
                      <TableCell>{perm.name}</TableCell>
                      <TableCell className="font-mono text-xs">{perm.resource}</TableCell>
                      <TableCell className="font-mono text-xs">{perm.action}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {perm.description || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      暂无权限
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建角色</DialogTitle>
            <DialogDescription>code/name 为必填，code 建议使用小写下划线。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-role-code">Code</Label>
              <Input
                id="create-role-code"
                value={createRoleForm.code}
                onChange={(e) => setCreateRoleForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="例如: ops_admin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role-name">名称</Label>
              <Input
                id="create-role-name"
                value={createRoleForm.name}
                onChange={(e) => setCreateRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例如: 运营管理员"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role-desc">描述</Label>
              <Textarea
                id="create-role-desc"
                value={createRoleForm.description || ""}
                onChange={(e) =>
                  setCreateRoleForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCreateRoleOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateRole}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>系统角色不允许修改 code。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role-code">Code</Label>
              <Input
                id="edit-role-code"
                value={editRoleForm.code || ""}
                onChange={(e) => setEditRoleForm((prev) => ({ ...prev, code: e.target.value }))}
                disabled={!!selectedRole?.isSystem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-name">名称</Label>
              <Input
                id="edit-role-name"
                value={editRoleForm.name || ""}
                onChange={(e) => setEditRoleForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role-desc">描述</Label>
              <Textarea
                id="edit-role-desc"
                value={editRoleForm.description || ""}
                onChange={(e) =>
                  setEditRoleForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditRoleOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateRole}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
