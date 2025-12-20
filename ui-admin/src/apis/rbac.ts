import type {
  AdminPermission,
  AdminRole,
  CreateAdminRoleInput,
  UpdateAdminRoleInput,
} from "@/types/rbac-management";
import { apiRequest } from "./http";

const API_BASE = "/api/admin";

export async function listAdminPermissions(): Promise<AdminPermission[]> {
  return apiRequest<AdminPermission[]>(`${API_BASE}/permissions`);
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  return apiRequest<AdminRole[]>(`${API_BASE}/roles`);
}

export async function createAdminRole(data: CreateAdminRoleInput): Promise<AdminRole> {
  return apiRequest<AdminRole>(`${API_BASE}/roles`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminRole(id: string, data: UpdateAdminRoleInput): Promise<AdminRole> {
  return apiRequest<AdminRole>(`${API_BASE}/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminRole(id: string): Promise<void> {
  await apiRequest<void>(`${API_BASE}/roles/${id}`, { method: "DELETE" });
}

export async function setAdminRolePermissions(
  id: string,
  permissionIds: string[]
): Promise<AdminRole> {
  return apiRequest<AdminRole>(`${API_BASE}/roles/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}
