import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        
        const { setTokens } = useAuthStore.getState();
        setTokens(data.accessToken, data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email: string, password: string, firstName: string, lastName: string) =>
    api.post('/auth/register', { email, password, firstName, lastName }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};

// Listings API
export const listingsAPI = {
  getAll: (filters?: any) => api.get('/listings', { params: filters }),
  getById: (id: string) => api.get(`/listings/${id}`),
  create: (data: any) => api.post('/listings', data),
  update: (id: string, data: any) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  search: (query: string) => api.get('/listings/search', { params: { q: query } }),
};

// Orders API
export const ordersAPI = {
  create: (listingId: string, quantity: number) =>
    api.post('/orders', { listingId, quantity }),
  getAll: (type: string) => api.get('/orders', { params: { type } }),
  getById: (id: string) => api.get(`/orders/${id}`),
  initiatePayment: (orderId: string) =>
    api.post('/orders/payment/initiate', { orderId }),
  updateStatus: (id: string, status: string, trackingNumber?: string) =>
    api.put(`/orders/${id}`, { status, trackingNumber }),
};

// Messages API
export const messagesAPI = {
  send: (receiverId: string, content: string, listingId?: string, orderId?: string) =>
    api.post('/messages', { receiverId, content, listingId, orderId }),
  getConversation: (otherUserId: string) =>
    api.get(`/messages/conversation/${otherUserId}`),
  getConversations: () => api.get('/messages/conversations'),
};

// Reviews API
export const reviewsAPI = {
  create: (listingId: string, revieweeId: string, rating: number, comment: string) =>
    api.post('/reviews', { listingId, revieweeId, rating, comment }),
  getListingReviews: (listingId: string) =>
    api.get(`/reviews/listing/${listingId}`),
  getUserReviews: (userId: string) =>
    api.get(`/reviews/user/${userId}`),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getById: (id: string) => api.get(`/users/${id}`),
};

export default api;