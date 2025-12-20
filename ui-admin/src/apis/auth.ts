import type { LoginRequest, LoginResponse, AdminUser } from '@/types/auth';
import { apiRequest } from './http';
export {
  clearStoredToken,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './auth-storage';
import { clearStoredToken, setStoredToken, setStoredUser } from './auth-storage';

const API_BASE = '/api/admin';

// 登录
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // 存储 token 和用户信息
  setStoredToken(result.token);
  setStoredUser(result.user);

  return result;
}

// 退出登录
export async function logout(): Promise<void> {
  try {
    await apiRequest(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
  } finally {
    clearStoredToken();
  }
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<AdminUser> {
  return apiRequest<AdminUser>(`${API_BASE}/auth/me`);
}

// 刷新 token
export async function refreshToken(): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(`${API_BASE}/auth/refresh`, {
    method: 'POST',
  });
}
