export interface AdminDashboardStats {
  users: AdminDashboardMetric;
  teams: AdminDashboardMetric;
  tools: AdminDashboardMetric;
  workflows: AdminDashboardMetric;
}

export type AdminDashboardTrend = "up" | "down" | "flat";

export interface AdminDashboardMetric {
  total: number;
  monthNew: number;
  prevMonthNew: number;
  changePct: number | null;
  trend: AdminDashboardTrend;
}
