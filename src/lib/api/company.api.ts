/**
 * company.api.ts
 *
 * API layer for the internal company staff portal.
 * All calls go to /api/company/* which is backed by the CompanyMember model.
 *
 * Used by:
 *  - /admin/staff-access-portal  (login page)
 *  - /admin/_components/DashboardNavbar (getMe, logout)
 */
import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

const COMPANY_SESSION_KEY = 'praedico_company_member';

export interface CompanyLoginData {
    email: string;
    password: string;
}

export const companyApi = {
    /**
     * POST /api/company/login
     * Authenticates a super_admin or employee from the CompanyMember collection.
     * Sets accessToken / refreshToken / sessionToken as HttpOnly cookies server-side.
     */
    login: async (data: CompanyLoginData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.LOGIN, data);

        // Store only non-sensitive UI metadata (token stays in HttpOnly cookie)
        if (response.data?.user) {
            localStorage.setItem(COMPANY_SESSION_KEY, JSON.stringify(response.data.user));
        }

        // Kick off the session idle monitor
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('login_success'));

            if (response.data.sessionExpiresAt) {
                import('@/lib/sessionManager').then(({ sessionManager }) => {
                    sessionManager.updateExpiry(response.data.sessionExpiresAt);
                });
            }
        }

        return response.data;
    },

    /**
     * GET /api/company/employees
     * Returns all company members — super_admin sees everyone.
     */
    getEmployees: async (search?: string) => {
        const params = search ? { search } : undefined;
        const response = await axiosInstance.get(API_ENDPOINTS.COMPANY.EMPLOYEES, { params });
        return response.data;
    },

    /**
     * GET /api/company/me
     * Returns the currently authenticated company member's profile.
     */
    getMe: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COMPANY.ME);
        return response.data;
    },

    /**
     * PUT /api/company/me
     * Updates this CompanyMember's personal profile (name + avatar + phone).
     * Writes to CompanyMemberModel ONLY — never touches UserModel.
     */
    updateMyProfile: async (data: { name?: string; avatar?: string; phone?: string }) => {
        const response = await axiosInstance.put(API_ENDPOINTS.COMPANY.ME, data);
        return response.data;
    },

    /**
     * PUT /api/company/me/change-password
     * Changes the CompanyMember's password.
     */
    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await axiosInstance.put(`${API_ENDPOINTS.COMPANY.ME}/change-password`, data);
        return response.data;
    },

    /** PATCH /api/company/employees/:id/role — assign custom role to employee */
    assignRole: async (employeeId: string, roleId: string | null) => {
        const response = await axiosInstance.patch(`${API_ENDPOINTS.COMPANY.EMPLOYEES}/${employeeId}/role`, { roleId });
        return response.data;
    },

    /** POST /api/company/invite — invite a new employee by email */
    inviteEmployee: async (payload: { name: string; email: string; phone?: string }) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.INVITE, payload);
        return response.data;
    },

    /** PATCH /api/company/employees/:id — update employee name/phone */
    updateEmployee: async (id: string, data: { name?: string; phone?: string }) => {
        const response = await axiosInstance.patch(API_ENDPOINTS.COMPANY.UPDATE_EMPLOYEE(id), data);
        return response.data;
    },

    /** DELETE /api/company/employees/:id — permanently delete employee */
    deleteEmployee: async (id: string) => {
        const response = await axiosInstance.delete(API_ENDPOINTS.COMPANY.DELETE_EMPLOYEE(id));
        return response.data;
    },

    /** POST /api/company/employees/:id/resend-invite — resend invitation email to unverified employee */
    resendInvite: async (id: string) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.RESEND_INVITE(id));
        return response.data;
    },

    /** PATCH /api/company/employees/:id/block — toggle active/inactive */
    toggleBlock: async (id: string) => {
        const response = await axiosInstance.patch(API_ENDPOINTS.COMPANY.BLOCK_EMPLOYEE(id));
        return response.data;
    },

    /** POST /api/company/verify-employee — public: set password via invite token */
    verifyEmployeeToken: async (token: string, password: string) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.VERIFY_EMPLOYEE, { token, password });
        return response.data;
    },

    /** POST /api/company/forgot-password — public: request password reset email */
    forgotPassword: async (email: string) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.FORGOT_PASSWORD, { email });
        return response.data;
    },

    /** POST /api/company/reset-password — public: set new password using reset token */
    resetPassword: async (token: string, newPassword: string) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.RESET_PASSWORD, { token, newPassword });
        return response.data;
    },

    // ─── Roles ────────────────────────────────────────────────────────────────

    /** GET /api/company/roles — fetch all custom roles */
    listRoles: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COMPANY.ROLES);
        return response.data;
    },

    /** POST /api/company/roles — create a new role */
    createRole: async (payload: { name: string; description?: string; permissions: string[] }) => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.ROLES, payload);
        return response.data;
    },

    /** PATCH /api/company/roles/:id — update a role */
    updateRole: async (id: string, payload: { name?: string; description?: string; permissions?: string[] }) => {
        const response = await axiosInstance.patch(`${API_ENDPOINTS.COMPANY.ROLES}/${id}`, payload);
        return response.data;
    },

    /** DELETE /api/company/roles/:id — delete a role */
    deleteRole: async (id: string) => {
        const response = await axiosInstance.delete(`${API_ENDPOINTS.COMPANY.ROLES}/${id}`);
        return response.data;
    },

    // ─── Activity Logs ────────────────────────────────────────────────────────

    /** GET /api/company/activity-logs — fetch recent audit logs */
    getActivityLogs: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COMPANY.ACTIVITY_LOGS);
        return response.data;
    },

    /** GET /api/company/activity-logs/:employeeId — fetch audit logs for a specific employee */
    getEmployeeActivityLogs: async (employeeId: string) => {
        const response = await axiosInstance.get(API_ENDPOINTS.COMPANY.EMPLOYEE_ACTIVITY_LOGS(employeeId));
        return response.data;
    },

    /** GET /api/company/session-status — poll current admin session expiry (non-sliding) */
    getSessionStatus: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.COMPANY.SESSION_STATUS, {
            headers: { 'X-Polling': 'true' },
        });
        return response.data;
    },

    /** POST /api/company/extend-session — slide the admin idle window */
    extendSession: async () => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.EXTEND_SESSION);
        return response.data;
    },

    /**
     * POST /api/company/logout
     * Invalidates the server-side session and clears cookies.
     */
    logout: async () => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.LOGOUT);
        localStorage.removeItem(COMPANY_SESSION_KEY);
        return response.data;
    },

    /**
     * POST /api/company/refresh-token
     * Silently refreshes the accessToken using the refreshToken cookie.
     */
    refreshToken: async () => {
        const response = await axiosInstance.post(API_ENDPOINTS.COMPANY.REFRESH_TOKEN);
        return response.data;
    },

    /**
     * Helper: read the cached company member from localStorage
     * (populated on login, used to avoid an extra getMe call).
     */
    getCachedMember: () => {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(COMPANY_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    },
};
