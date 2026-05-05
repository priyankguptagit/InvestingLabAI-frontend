import axiosInstance from '../axios';

export const feedbackApi = {
  getPublicTestimonials: async (limit: number = 10) => {
    const response = await axiosInstance.get(`/api/feedback/public/testimonials?limit=${limit}`);
    return response.data;
  },
};
