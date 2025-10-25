// 用户相关类型
export interface User {
  id: string;
  phoneNumber: string;
  registeredAt: string;
  lastLoginAt?: string;
}

// 商品相关类型
export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  sales: number;
  category: string;
}

// 分类相关类型
export interface Category {
  id: string;
  name: string;
  icon: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

// 认证相关的响应类型（直接包含token等字段，不包装在data中）
export interface AuthResponse {
  token: string;
  userId: string;
  message: string;
  redirectUrl?: string;
}

// 首页数据类型
export interface HomepageData {
  hotProducts: Product[];
  categories: Category[];
  banners: any[];
}

// 搜索结果类型
export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

// 表单状态类型
export interface FormState {
  phoneNumber: string;
  verificationCode: string;
  agreeToTerms?: boolean;
  isLoading: boolean;
  countdown: number;
  error: string;
  canGetCode: boolean;
}