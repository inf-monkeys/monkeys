import type {
  AdminAccount,
  CreateAdminAccountInput,
  PaginatedResponse,
  UpdateAdminAccountInput,
} from "@/types/user-management";
import { clearStoredToken, getStoredToken } from "./auth";

const API_BASE = "/api/admin/admin-users";

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

export async function listAdminAccounts(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<PaginatedResponse<AdminAccount>> {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  return request<PaginatedResponse<AdminAccount>>(url);
}

export async function createAdminAccount(
  data: CreateAdminAccountInput
): Promise<AdminAccount> {
  return request<AdminAccount>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminAccount(
  id: string,
  data: UpdateAdminAccountInput
): Promise<AdminAccount> {
  return request<AdminAccount>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminAccount(id: string): Promise<void> {
  await request<void>(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function resetAdminAccountPassword(
  id: string,
  password: string
): Promise<void> {
  await request<void>(`${API_BASE}/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

