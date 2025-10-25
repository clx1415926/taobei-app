import { ApiResponse, HomepageData, SearchResult, User } from '../types';

const API_BASE_URL = '/api';

// 通用请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // 检查响应是否为空或者不是JSON格式
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // 如果JSON解析失败，创建一个错误对象
        data = { error: 'Invalid JSON response from server' };
      }
    } else {
      // 如果不是JSON响应，尝试获取文本内容
      const text = await response.text();
      data = { error: text || 'Non-JSON response from server' };
    }
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // 如果是网络错误或其他错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络或后端服务是否正常运行');
    }
    throw error;
  }
}

// 认证相关API
export const authApi = {
  // 发送验证码
  sendVerificationCode: async (phoneNumber: string, type: 'login' | 'register' = 'register'): Promise<ApiResponse> => {
    return request('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, type }),
    });
  },

  // 用户登录
  login: async (phoneNumber: string, verificationCode: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, verificationCode }),
    });
    
    // 保存token到localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  // 用户注册
  register: async (phoneNumber: string, verificationCode: string, agreeToTerms: boolean = true): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, verificationCode, agreeToTerms }),
    });
    
    // 保存token到localStorage
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  // 用户登出
  logout: async (): Promise<ApiResponse> => {
    const token = localStorage.getItem('authToken');
    const response = await request('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // 清除本地存储的token
    localStorage.removeItem('authToken');
    
    return response;
  }
};

// 首页相关API
export const homepageApi = {
  // 获取首页数据
  getHomepageData: async (): Promise<ApiResponse<HomepageData>> => {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return request<HomepageData>('/homepage', {
      method: 'GET',
      headers,
    });
  },

  // 搜索商品
  searchProducts: async (keyword: string, page: number = 1, sort: string = 'sales'): Promise<ApiResponse<SearchResult>> => {
    const params = new URLSearchParams({
      keyword,
      page: page.toString(),
      limit: '20',
      sortBy: sort
    });
    
    return request<SearchResult>(`/homepage/search?${params}`, {
      method: 'GET',
    });
  },

  // 获取商品分类
  getCategories: async (): Promise<ApiResponse<{ categories: any[] }>> => {
    return request<{ categories: any[] }>('/homepage/categories', {
      method: 'GET',
    });
  }
};

// 用户相关API
export const userApi = {
  // 获取用户信息
  getUserProfile: async (): Promise<ApiResponse<User>> => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('未登录');
    }
    
    return request<User>('/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
};