import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
  role?: string;
}

export interface LoginResult {
  token: string;
  username: string;
  role: string;
}

export const authApi = {
  login: (data: LoginParams) => request.post<any, any>('/auth/login', data),
  register: (data: RegisterParams) => request.post<any, any>('/auth/register', data),
  getMe: () => request.get<any, any>('/auth/me'),
};

export const productApi = {
  list: (params?: Record<string, any>) => request.get<any, any>('/products', { params }),
  detail: (id: number) => request.get<any, any>(`/products/${id}`),
  create: (data: any) => request.post<any, any>('/products', data),
  update: (id: number, data: any) => request.put<any, any>(`/products/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/products/${id}`),
  categories: () => request.get<any, any>('/products/categories'),
};

export const adApi = {
  list: (params?: Record<string, any>) => request.get<any, any>('/ads', { params }),
  active: () => request.get<any, any>('/ads/active'),
  detail: (id: number) => request.get<any, any>(`/ads/${id}`),
  create: (data: any) => request.post<any, any>('/ads', data),
  update: (id: number, data: any) => request.put<any, any>(`/ads/${id}`, data),
  updateStatus: (id: number, status: number) =>
    request.put<any, any>(`/ads/${id}/status`, null, { params: { status } }),
};

export const statsApi = {
  overview: () => request.get<any, any>('/stats/overview'),
  operations: () => request.get<any, any>('/stats/operations'),
};
