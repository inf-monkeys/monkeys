import type {
  AdminPermission,
  AdminRole,
  CreateAdminRoleInput,
  UpdateAdminRoleInput,
} from "@/types/rbac-management";
import { clearStoredToken, getStoredToken } from "./auth";

const API_BASE = "/api/admin";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      window.location.href = "/login";
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "请求失败");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function listAdminPermissions(): Promise<AdminPermission[]> {
  return request<AdminPermission[]>(`${API_BASE}/permissions`);
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  return request<AdminRole[]>(`${API_BASE}/roles`);
}

export async function createAdminRole(data: CreateAdminRoleInput): Promise<AdminRole> {
  return request<AdminRole>(`${API_BASE}/roles`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminRole(id: string, data: UpdateAdminRoleInput): Promise<AdminRole> {
  return request<AdminRole>(`${API_BASE}/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminRole(id: string): Promise<void> {
  await request<void>(`${API_BASE}/roles/${id}`, { method: "DELETE" });
}

export async function setAdminRolePermissions(
  id: string,
  permissionIds: string[]
): Promise<AdminRole> {
  return request<AdminRole>(`${API_BASE}/roles/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}

