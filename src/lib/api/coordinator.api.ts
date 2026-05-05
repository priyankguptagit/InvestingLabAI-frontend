import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

const AUTH_SESSION_KEY = 'praedico_auth_session_type';

// ============================================
// TYPES
// ============================================

export interface CreateCoordinatorData {
    departmentId: string;
    name: string;
    email: string;
    mobile: string;
    designation: 'hod' | 'faculty' | 'coordinator' | 'other';
}

export interface CoordinatorVerifyData {
    token: string;
    password: string;
}

export interface CoordinatorLoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface CoordinatorApproveRejectData {
    reason?: string;
}

// ============================================
// COORDINATOR API
// ============================================

export const coordinatorApi = {
    // ============================================
    // PUBLIC ROUTES
    // ============================================

    verify: async (data: CoordinatorVerifyData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.VERIFY, data);

        // Store only non-sensitive UI metadata — accessToken stays in HttpOnly cookie
        localStorage.setItem(AUTH_SESSION_KEY, 'coordinator');
        if (response.data.coordinator) {
            localStorage.setItem('coordinator', JSON.stringify(response.data.coordinator));
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('login_success'));
        }

        return response.data;
    },

    login: async (data: CoordinatorLoginData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.LOGIN, data);

        // Store only non-sensitive UI metadata — accessToken stays in HttpOnly cookie
        localStorage.setItem(AUTH_SESSION_KEY, 'coordinator');
        if (response.data.coordinator) {
            localStorage.setItem('coordinator', JSON.stringify(response.data.coordinator));
        }

        // Signal session timeout hook to start monitoring
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('login_success'));
        }

        return response.data;
    },

    logout: async () => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.LOGOUT);
        // Backend clears the HttpOnly cookie — we just clear UI metadata
        localStorage.removeItem('coordinator');
        localStorage.removeItem(AUTH_SESSION_KEY);
        return response.data;
    },

    // ============================================
    // PROTECTED COORDINATOR ROUTES
    // ============================================

    getMe: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.ME);
        return response.data;
    },

    updateProfile: async (data: {
        name?: string;
        mobile?: string;
        profilePhoto?: string;
        bio?: string;
    }) => {
        const response = await axiosInstance.put(API_ENDPOINTS.COORDINATOR.UPDATE_ME, data);
        return response.data;
    },

    getMyStudents: async (params?: { status?: string, includePortfolio?: boolean, plan?: string }) => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.STUDENTS, { params });
        return response.data;
    },

    getPendingStudents: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.STUDENTS_PENDING);
        return response.data;
    },

    approveStudent: async (studentId: string) => {
        const response = await axiosInstance.patch(
            API_ENDPOINTS.COORDINATOR.APPROVE_STUDENT(studentId)
        );
        return response.data;
    },

    rejectStudent: async (studentId: string, data?: CoordinatorApproveRejectData) => {
        const response = await axiosInstance.patch(
            API_ENDPOINTS.COORDINATOR.REJECT_STUDENT(studentId),
            data
        );
        return response.data;
    },

    addStudent: async (data: { name: string; email: string; plan?: 'Free' | 'Silver' | 'Gold' | 'Diamond' }) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.ADD_STUDENT, data);
        return response.data;
    },

    importStudentsCSV: async (data: { students: Array<{ name: string; email: string }> }) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.IMPORT_CSV, data);
        return response.data;
    },

    // Student Management (Department Restricted)
    getStudentById: async (studentId: string) => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.GET_STUDENT(studentId));
        return response.data;
    },

    updateStudent: async (studentId: string, data: {
        name?: string;
        email?: string;
        plan?: 'Free' | 'Silver' | 'Gold' | 'Diamond';
    }) => {
        const response = await axiosInstance.put(API_ENDPOINTS.COORDINATOR.UPDATE_STUDENT(studentId), data);
        return response.data;
    },

    archiveStudent: async (studentId: string) => {
        const response = await axiosInstance.delete(API_ENDPOINTS.COORDINATOR.ARCHIVE_STUDENT(studentId));
        return response.data;
    },

    unarchiveStudent: async (studentId: string) => {
        const response = await axiosInstance.patch(API_ENDPOINTS.COORDINATOR.UNARCHIVE_STUDENT(studentId));
        return response.data;
    },

    getStudentPortfolio: async (studentId: string) => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.STUDENT_PORTFOLIO(studentId));
        return response.data;
    },

    bulkAction: async (data: { studentIds: string[], action: 'archive' | 'unarchive' }) => {
        const response = await axiosInstance.patch(API_ENDPOINTS.COORDINATOR.BULK_ACTION, data);
        return response.data;
    },

    reconcileStudents: async () => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.RECONCILE);
        return response.data;
    },

    getStudentReport: async (studentId: string) => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.STUDENT_REPORT(studentId));
        return response.data;
    },

    submitReview: async (studentId: string, data: { factor1Rating: number; factor2Rating: number; factor3Rating: number; suggestions?: string; }) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.STUDENT_REVIEW(studentId), data);
        return response.data;
    },

    // ============================================
    // ORGANIZATION ADMIN ROUTES (Manage Coordinators)
    // ============================================

    createCoordinator: async (data: CreateCoordinatorData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COORDINATOR.CREATE, data);
        return response.data;
    },

    getAllCoordinators: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COORDINATOR.ALL);
        return response.data;
    },

    deleteCoordinator: async (coordinatorId: string) => {
        const response = await axiosInstance.delete(
            API_ENDPOINTS.COORDINATOR.DELETE(coordinatorId)
        );
        return response.data;
    },
};
