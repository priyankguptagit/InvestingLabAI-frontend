import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

// ============================================
// TYPES
// ============================================

export interface CreateDepartmentData {
    departmentName: string;
    departmentCode: string;
    description?: string;
}

export interface UpdateDepartmentData {
    departmentName?: string;
    departmentCode?: string;
    description?: string;
    isActive?: boolean;
}

// ============================================
// DEPARTMENT API
// ============================================

export const departmentApi = {
    // ============================================
    // PUBLIC ROUTES
    // ============================================

    getPublicDepartments: async (organizationId: string) => {
        const response = await axiosInstance.get(
            API_ENDPOINTS.DEPARTMENT.PUBLIC(organizationId)
        );
        return response.data;
    },

    // ============================================
    // PROTECTED ROUTES (Organization Admin & Coordinator)
    // ============================================

    createDepartment: async (data: CreateDepartmentData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.DEPARTMENT.CREATE, data);
        return response.data;
    },

    getDepartments: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.DEPARTMENT.LIST);
        return response.data;
    },

    getDepartmentById: async (departmentId: string) => {
        const response = await axiosInstance.get(
            API_ENDPOINTS.DEPARTMENT.BY_ID(departmentId)
        );
        return response.data;
    },

    getDepartmentDetails: async (departmentId: string) => {
        const response = await axiosInstance.get(
            API_ENDPOINTS.DEPARTMENT.DETAILS(departmentId)
        );
        return response.data;
    },

    updateDepartment: async (departmentId: string, data: UpdateDepartmentData) => {
        const response = await axiosInstance.patch(
            API_ENDPOINTS.DEPARTMENT.UPDATE(departmentId),
            data
        );
        return response.data;
    },

    deleteDepartment: async (departmentId: string) => {
        const response = await axiosInstance.delete(
            API_ENDPOINTS.DEPARTMENT.DELETE(departmentId)
        );
        return response.data;
    },
};
