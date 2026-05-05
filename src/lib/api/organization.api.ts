import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

const AUTH_SESSION_KEY = 'praedico_auth_session_type';

// ============================================
// TYPES
// ============================================

export interface OrganizationRegisterData {
  organizationName: string;
  organizationType: 'university' | 'college' | 'institute' | 'school' | 'other';
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  registeredBy: {
    name: string;
    designation: string;
  };
}

export interface OrganizationVerifyData {
  token: string;
  password: string;
}

export interface OrganizationLoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreateAdminData {
  name: string;
  email: string;
  mobile: string;
  designation: 'dean' | 'director' | 'principal' | 'admin' | 'other';
}

export interface ApproveRejectData {
  reason?: string;
}

// ============================================
// ORGANIZATION API
// ============================================

export const organizationApi = {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  register: async (data: OrganizationRegisterData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.REGISTER, data);
    return response.data;
  },

  verify: async (data: OrganizationVerifyData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.VERIFY, data);
    return response.data;
  },

  login: async (data: OrganizationLoginData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.LOGIN, data);

    // Store only non-sensitive UI metadata — accessToken stays in HttpOnly cookie
    localStorage.setItem(AUTH_SESSION_KEY, 'organization');
    if (response.data.organization) {
      localStorage.setItem('organization', JSON.stringify(response.data.organization));
    }
    if (response.data.admin) {
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
    }

    // Signal session timeout hook to start monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('login_success'));
    }

    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.LOGOUT);
    // Backend clears the HttpOnly cookie — we just clear UI metadata
    localStorage.removeItem('organization');
    localStorage.removeItem('admin');
    localStorage.removeItem(AUTH_SESSION_KEY);
    return response.data;
  },

  getPublicList: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.PUBLIC_LIST);
    return response.data;
  },

  // ============================================
  // PROTECTED ORGANIZATION ADMIN ROUTES
  // ============================================

  getMe: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.ME);
    return response.data;
  },

  /**
   * PUT /api/organization/admin/me
   * Updates the Org Admin's personal profile (name + avatar).
   * Writes to OrganizationAdminModel ONLY — never touches UserModel.
   */
  updateAdminProfile: async (data: { name?: string; avatar?: string }) => {
    const response = await axiosInstance.put('/api/organization/admin/me', data);
    return response.data;
  },

  updateProfile: async (data: {
    organizationName?: string;
    organizationType?: 'university' | 'college' | 'institute' | 'school' | 'other';
    logoUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }) => {
    const response = await axiosInstance.put(API_ENDPOINTS.ORGANIZATION.ME, data);
    return response.data;
  },

  getStats: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.STATS);
    return response.data;
  },

  createAdmin: async (data: CreateAdminData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.ADMINS, data);
    return response.data;
  },

  getPendingStudents: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.STUDENTS_PENDING);
    return response.data;
  },

  getStudents: async (params?: { status?: string; departmentId?: string; includePortfolio?: boolean }) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.STUDENTS, { params });
    return response.data;
  },

  approveStudent: async (studentId: string) => {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.ORGANIZATION.APPROVE_STUDENT(studentId)
    );
    return response.data;
  },

  rejectStudent: async (studentId: string, data?: ApproveRejectData) => {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.ORGANIZATION.REJECT_STUDENT(studentId),
      data
    );
    return response.data;
  },

  // ============================================
  // STUDENT MANAGEMENT
  // ============================================

  addStudent: async (data: { name: string; email: string; departmentId: string; plan?: 'Free' | 'Silver' | 'Gold' | 'Diamond' }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.ADD_STUDENT, data);
    return response.data;
  },

  importStudentsCSV: async (data: { students: Array<{ name: string; email: string; department: string }> }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.IMPORT_CSV, data);
    return response.data;
  },

  // Student Management
  getStudentById: async (studentId: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.GET_STUDENT(studentId));
    return response.data;
  },

  updateStudent: async (studentId: string, data: {
    name?: string;
    email?: string;
    plan?: 'Free' | 'Silver' | 'Gold' | 'Diamond';
  }) => {
    const response = await axiosInstance.put(API_ENDPOINTS.ORGANIZATION.UPDATE_STUDENT(studentId), data);
    return response.data;
  },

  archiveStudent: async (studentId: string) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.ORGANIZATION.ARCHIVE_STUDENT(studentId));
    return response.data;
  },

  unarchiveStudent: async (studentId: string) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.ORGANIZATION.UNARCHIVE_STUDENT(studentId));
    return response.data;
  },

  getStudentPortfolio: async (studentId: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.STUDENT_PORTFOLIO(studentId));
    return response.data;
  },

  reconcileStudents: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.RECONCILE);
    return response.data;
  },

  getStudentReport: async (studentId: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.STUDENT_REPORT(studentId));
    return response.data;
  },

  submitReview: async (studentId: string, data: {
    factor1Rating: number;
    factor2Rating: number;
    factor3Rating: number;
    suggestions?: string;
  }) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORGANIZATION.STUDENT_REVIEW(studentId), data);
    return response.data;
  },

  bulkAction: async (data: { studentIds: string[], action: 'archive' | 'unarchive' }) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.ORGANIZATION.BULK_ACTION, data);
    return response.data;
  },

  // ============================================
  // PLATFORM ADMIN ROUTES (Manage Organizations)
  // ============================================

  getAllOrganizations: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORGANIZATION.ALL, { params });
    return response.data;
  },

  toggleOrganizationActive: async (organizationId: string) => {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.ORGANIZATION.TOGGLE_ACTIVE(organizationId)
    );
    return response.data;
  },
};
