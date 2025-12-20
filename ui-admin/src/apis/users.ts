import type {
  CreateUserInput,
  PaginatedResponse,
  UpdateUserInput,
  User,
} from "@/types/user-management";
import { apiRequest } from "./http";

const API_BASE = "/api/admin/users";

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
  return apiRequest<PaginatedResponse<User>>(url);
}

export async function createUser(data: CreateUserInput): Promise<User> {
  return apiRequest<User>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  return apiRequest<User>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest<void>(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function resetUserPassword(id: string, password: string): Promise<void> {
  await apiRequest<void>(`${API_BASE}/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
