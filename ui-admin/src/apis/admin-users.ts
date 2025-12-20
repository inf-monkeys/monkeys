import type {
  AdminAccount,
  CreateAdminAccountInput,
  PaginatedResponse,
  UpdateAdminAccountInput,
} from "@/types/user-management";
import { apiRequest } from "./http";

const API_BASE = "/api/admin/admin-users";

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
  return apiRequest<PaginatedResponse<AdminAccount>>(url);
}

export async function createAdminAccount(
  data: CreateAdminAccountInput
): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(API_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminAccount(
  id: string,
  data: UpdateAdminAccountInput
): Promise<AdminAccount> {
  return apiRequest<AdminAccount>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminAccount(id: string): Promise<void> {
  await apiRequest<void>(`${API_BASE}/${id}`, { method: "DELETE" });
}

export async function resetAdminAccountPassword(
  id: string,
  password: string
): Promise<void> {
  await apiRequest<void>(`${API_BASE}/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}
