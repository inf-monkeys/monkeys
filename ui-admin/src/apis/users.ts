import type {
  CreateUserInput,
  PaginatedResponse,
  UpdateUserInput,
  User,
} from "@/types/user-management";
import { clearStoredToken, getStoredToken } from "./auth";

const API_BASE = "/api/admin/users";

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

export async function listUsers(params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<PaginatedResponse<User>> {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  return request<PaginatedResponse<User>>(url);
}

export async function createUser(data: CreateUserInput): Promise<User> {
  return request<User>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  return request<User>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request<void>(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  await request<void>(`${API_BASE}/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

