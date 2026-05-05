import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  lastLogin?: string;
  lastActive?: string;
  currentPlan?: string;
  subscriptionExpiry?: string;
  subscriptionStatus?: string;
  isOrgStudent?: boolean;
  orgName?: string;
  orgLogoUrl?: string;
  organization?: { _id: string; organizationName: string; logoUrl?: string; website?: string } | null;
  department?: { _id: string; departmentName: string } | null;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;
  registeredUsers: number;
  deletedUsers: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListResponse {
  success: boolean;
  users: User[];
  pagination: Pagination;
}

export interface StatsResponse {
  success: boolean;
  stats: UserStats;
}

// ============================================
// USER API SERVICE
// ============================================

export const userApi = {

  // --- 1. USER SELF PROFILE ---

  getProfile: async () => {
    const endpoint = API_ENDPOINTS.USER?.PROFILE || '/api/users/me';
    const response = await axiosInstance.get(endpoint);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const endpoint = API_ENDPOINTS.USER?.UPDATE || '/api/users/update';
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  },

  // --- 2. ADMIN USER MANAGEMENT ---

  // Get All Users (with pagination, search, filters)
  getAllUsers: async (params: Record<string, string | boolean>) => {
    const response = await axiosInstance.get<UserListResponse>('/api/users/all', { params });
    return response.data;
  },

  // Get Admin Dashboard Stats
  getStats: async () => {
    const response = await axiosInstance.get<StatsResponse>('/api/users/stats');
    return response.data;
  },

  // Update Specific User (Admin Edit)
  updateUser: async (userId: string, data: Partial<User>) => {
    const response = await axiosInstance.put(`/api/users/${userId}`, data);
    return response.data;
  },

  // Toggle User Active Status (Block/Unblock)
  toggleActive: async (userId: string) => {
    const response = await axiosInstance.patch(`/api/users/${userId}/toggle-active`);
    return response.data;
  },

  // Archive User (Soft Delete)
  softDelete: async (userId: string) => {
    const response = await axiosInstance.patch(`/api/users/${userId}/soft-delete`);
    return response.data;
  },

  // Restore Archived User
  restore: async (userId: string) => {
    const response = await axiosInstance.patch(`/api/users/${userId}/restore`);
    return response.data;
  },

  // Bulk Actions
  bulkAction: async (data: { userIds: string[], action: 'archive' | 'unarchive' | 'block' | 'unblock' }) => {
    const response = await axiosInstance.patch('/api/users/bulk-action', data);
    return response.data;
  },

  // Admin: Change individual user's plan (no payment — admin override)
  adminChangePlan: async (
    userId: string,
    planName: 'Silver' | 'Gold' | 'Diamond' | 'Free',
    durationMonths?: 1 | 3 | 6
  ) => {
    const response = await axiosInstance.patch(`/api/users/${userId}/change-plan`, {
      planName,
      durationMonths,
    });
    return response.data;
  },

  // Get My Portfolio Report
  getMyReport: async () => {
    const response = await axiosInstance.get('/api/users/my-report');
    return response.data;
  },
};