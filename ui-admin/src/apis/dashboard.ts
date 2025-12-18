import type { AdminDashboardStats } from "@/types/dashboard";
import { apiRequest } from "./http";

const API_BASE = "/api/admin/dashboard";

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return apiRequest<AdminDashboardStats>(`${API_BASE}/stats`);
}

