// API Configuration
// Use your computer's IP address instead of localhost for mobile testing
const API_BASE_URL = __DEV__ 
  ? 'http://172.16.13.183:3002/api'  // Updated to current IP address
  : 'https://your-production-api.com/api';

// API Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: any[];
}

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  currency: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Storage for auth token
let authToken: string | null = null;

// Get stored token (you might want to use AsyncStorage for persistence)
export const getAuthToken = (): string | null => {
  return authToken;
};

// Set auth token
export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

// Clear auth token
export const clearAuthToken = (): void => {
  authToken = null;
};

// HTTP Client with auth headers
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    try {
      console.log('📡 Making fetch request...');
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`📡 Response status: ${response.status}`);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        console.log(`❌ Response not OK: ${response.status}`);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ API Request successful');
      return data;
    } catch (error) {
      console.log('❌ API Request failed:', error);
      // Removed console.error to prevent "API request failed" message display
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    if (response.status === 'success' && response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.status === 'success' && response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.get<{ user: User }>('/auth/me');
  },

  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.put<{ user: User }>('/auth/profile', updates);
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    return apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    clearAuthToken();
    return response;
  },

  // Delete account
  deleteAccount: async (password: string): Promise<ApiResponse> => {
    const response = await apiClient.delete('/auth/account');
    clearAuthToken();
    return response;
  },
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: async (): Promise<ApiResponse<{ categories: any[] }>> => {
    return apiClient.get('/categories');
  },

  // Get categories with totals
  getCategoriesWithTotals: async (startDate?: string, endDate?: string): Promise<ApiResponse<{ categories: any[] }>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/categories/with-totals${query}`);
  },

  // Create new category
  createCategory: async (categoryData: any): Promise<ApiResponse<{ category: any }>> => {
    return apiClient.post('/categories', categoryData);
  },

  // Update category
  updateCategory: async (id: string, updates: any): Promise<ApiResponse<{ category: any }>> => {
    return apiClient.put(`/categories/${id}`, updates);
  },

  // Delete category
  deleteCategory: async (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/categories/${id}`);
  },

  // Setup default categories
  setupDefaults: async (): Promise<ApiResponse<{ categories: any[] }>> => {
    return apiClient.post('/categories/setup-defaults');
  },
};

// Expenses API
export const expensesAPI = {
  // Get expenses with filters
  getExpenses: async (filters: {
    page?: number;
    limit?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
    search?: string;
  } = {}): Promise<ApiResponse<{ expenses: any[]; pagination: any }>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/expenses${query}`);
  },

  // Get single expense
  getExpense: async (id: string): Promise<ApiResponse<{ expense: any }>> => {
    return apiClient.get(`/expenses/${id}`);
  },

  // Create new expense
  createExpense: async (expenseData: any): Promise<ApiResponse<{ expense: any }>> => {
    return apiClient.post('/expenses', expenseData);
  },

  // Update expense
  updateExpense: async (id: string, updates: any): Promise<ApiResponse<{ expense: any }>> => {
    return apiClient.put(`/expenses/${id}`, updates);
  },

  // Delete expense
  deleteExpense: async (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/expenses/${id}`);
  },

  // Get expense statistics
  getStats: async (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/expenses/stats/summary${query}`);
  },

  // Get recent expenses
  getRecent: async (limit: number = 10): Promise<ApiResponse<{ recentExpenses: any[] }>> => {
    return apiClient.get(`/expenses/stats/recent?limit=${limit}`);
  },
};

// Budgets API
export const budgetsAPI = {
  // Get all budgets
  getBudgets: async (active?: boolean, period?: string): Promise<ApiResponse<{ budgets: any[] }>> => {
    const params = new URLSearchParams();
    if (active !== undefined) params.append('active', active.toString());
    if (period) params.append('period', period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/budgets${query}`);
  },

  // Get current budgets
  getCurrentBudgets: async (): Promise<ApiResponse<{ budgets: any[] }>> => {
    return apiClient.get('/budgets/current');
  },

  // Get single budget
  getBudget: async (id: string): Promise<ApiResponse<{ budget: any }>> => {
    return apiClient.get(`/budgets/${id}`);
  },

  // Create new budget
  createBudget: async (budgetData: any): Promise<ApiResponse<{ budget: any }>> => {
    return apiClient.post('/budgets', budgetData);
  },

  // Update budget
  updateBudget: async (id: string, updates: any): Promise<ApiResponse<{ budget: any }>> => {
    return apiClient.put(`/budgets/${id}`, updates);
  },

  // Delete budget
  deleteBudget: async (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/budgets/${id}`);
  },

  // Get budget overview
  getOverview: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/budgets/stats/overview');
  },
};

// Users API
export const usersAPI = {
  // Get dashboard data
  getDashboard: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/users/dashboard');
  },

  // Get user settings
  getSettings: async (): Promise<ApiResponse<{ settings: any }>> => {
    return apiClient.get('/users/settings');
  },

  // Update user settings
  updateSettings: async (settings: any): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.put('/users/settings', settings);
  },

  // Get user statistics
  getStats: async (period: string = 'month'): Promise<ApiResponse<{ stats: any }>> => {
    return apiClient.get(`/users/stats?period=${period}`);
  },
};

// Test API connection
export const testAPI = {
  // Test basic connection
  test: async (): Promise<ApiResponse> => {
    return apiClient.get('/test');
  },

  // Test database connection
  testDB: async (): Promise<ApiResponse> => {
    return apiClient.get('/db-test');
  },
};

// Export the API client for custom requests
export { apiClient };

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
