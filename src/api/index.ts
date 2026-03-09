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

export const brandApi = {
  list: () => request.get<any, any>('/brands'),
  detail: (id: number) => request.get<any, any>(`/brands/${id}`),
  create: (data: any) => request.post<any, any>('/brands', data),
  update: (id: number, data: any) => request.put<any, any>(`/brands/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/brands/${id}`),
};

export const statsApi = {
  overview: () => request.get<any, any>('/stats/overview'),
  operations: () => request.get<any, any>('/stats/operations'),
};

// ---- 购物车 ----
export const cartApi = {
  list: () => request.get<any, any>('/cart'),
  add: (data: { productId: number; quantity: number }) =>
    request.post<any, any>('/cart', data),
  updateQuantity: (id: number, quantity: number) =>
    request.put<any, any>(`/cart/${id}`, { quantity }),
  remove: (id: number) => request.delete<any, any>(`/cart/${id}`),
  clear: () => request.delete<any, any>('/cart'),
  updateChecked: (id: number, checked: number) =>
    request.put<any, any>(`/cart/${id}/checked`, { checked }),
};

// ---- 订单 ----
export const orderApi = {
  create: (data: {
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    paymentMethod: string;
    couponId?: number;
    remark?: string;
  }) => request.post<any, any>('/orders', data),
  list: (params?: Record<string, any>) => request.get<any, any>('/orders', { params }),
  detail: (id: number) => request.get<any, any>(`/orders/${id}`),
  pay: (id: number, paymentMethod?: string) =>
    request.post<any, any>(`/orders/${id}/pay`, { paymentMethod: paymentMethod ?? 'ALIPAY' }),
  cancel: (id: number) => request.post<any, any>(`/orders/${id}/cancel`),
  ship: (id: number) => request.put<any, any>(`/orders/${id}/ship`),
  complete: (id: number) => request.put<any, any>(`/orders/${id}/complete`),
};

// 后端订单状态数字 → 前端字符串
export const ORDER_STATUS_MAP: Record<number, string> = {
  0: 'PENDING',
  1: 'PAID',
  2: 'SHIPPED',
  3: 'COMPLETED',
  4: 'CANCELLED',
};

// ---- 评价 ----
export const reviewApi = {
  listByProduct: (productId: number, params?: Record<string, any>) =>
    request.get<any, any>(`/products/${productId}/reviews`, { params }),
  create: (productId: number, data: { rating: number; content: string; orderId?: number }) =>
    request.post<any, any>(`/products/${productId}/reviews`, data),
};

// ---- 浏览历史 ----
export const browseHistoryApi = {
  record: (productId: number) =>
    request.post<any, any>('/browse-history', { productId }),
};

// ---- 收藏 ----
export const favoriteApi = {
  list: () => request.get<any, any>('/favorites'),
  check: (productId: number) => request.get<any, any>(`/favorites/check/${productId}`),
  add: (productId: number) => request.post<any, any>(`/favorites/${productId}`),
  remove: (productId: number) => request.delete<any, any>(`/favorites/${productId}`),
};

// ---- 优惠券 ----
export const couponApi = {
  list: () => request.get<any, any>('/coupons'),
  mine: () => request.get<any, any>('/coupons/mine'),
  claim: (id: number) => request.post<any, any>(`/coupons/${id}/claim`),
  create: (data: any) => request.post<any, any>('/coupons', data),
  update: (id: number, data: any) => request.put<any, any>(`/coupons/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/coupons/${id}`),
};

// ---- 推荐 ----
export const recommendApi = {
  list: () => request.get<any, any>('/recommendations'),
};

// ---- 分类管理 ----
export const categoryApi = {
  tree: () => request.get<any, any>('/categories'),
  list: () => request.get<any, any>('/categories/list'),
  create: (data: any) => request.post<any, any>('/categories', data),
  update: (id: number, data: any) => request.put<any, any>(`/categories/${id}`, data),
  delete: (id: number) => request.delete<any, any>(`/categories/${id}`),
};
