import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

export interface AdminLoginData {
  email: string;
  password: string;
}


const EMPTY_STATS = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    pendingVerifications: 0,
  }
};

export const adminApi = {
  login: async (data: AdminLoginData) => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.ADMIN.LOGIN, data);
      
      // Store only non-sensitive UI metadata — accessToken stays in HttpOnly cookie
      if (response.data?.admin) {
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
      }
      return response.data;
    } catch (error) {
      console.error("Login Failed:", error);
      throw error; 
    }
  },

  getDashboardStats: async () => {
    try {

      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD);
      return response.data;
    } catch (error) {

      console.warn("⚠️ API Failed (404). Returning empty stats to keep UI alive.");
      console.warn("Check API_ENDPOINTS.ADMIN.DASHBOARD value in constants.ts");
      return EMPTY_STATS; 
    }
  },

  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.USERS);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  },
};