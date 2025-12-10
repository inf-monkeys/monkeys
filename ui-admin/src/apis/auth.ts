import type { LoginRequest, LoginResponse, AdminUser } from '@/types/auth';

const API_BASE = '/api/admin';

// 存储 token 的 key
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

// 获取存储的 token
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// 存储 token
export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

// 清除 token
export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 获取存储的用户信息
export function getStoredUser(): AdminUser | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// 存储用户信息
export function setStoredUser(user: AdminUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// HTTP 请求封装
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

// 登录
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const result = await request<LoginResponse>(`${API_BASE}/auth/login`, {
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
    await request(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
  } finally {
    clearStoredToken();
  }
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<AdminUser> {
  return request<AdminUser>(`${API_BASE}/auth/me`);
}

// 刷新 token
export async function refreshToken(): Promise<LoginResponse> {
  return request<LoginResponse>(`${API_BASE}/auth/refresh`, {
    method: 'POST',
  });
}
