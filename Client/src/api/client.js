import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if we are not already on the login or register page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Policies
export const listPolicies = () => api.get('/iam/policies');
export const getPolicy = (id) => api.get(`/iam/policies/${id}`);
export const createPolicy = (data) => api.post('/iam/policies', data);
export const updatePolicy = (id, data) => api.put(`/iam/policies/${id}`, data);
export const deletePolicy = (id) => api.delete(`/iam/policies/${id}`);

// Groups
export const listGroups = () => api.get('/iam/groups');
export const getGroup = (id) => api.get(`/iam/groups/${id}`);
export const createGroup = (data) => api.post('/iam/groups', data);
export const updateGroup = (id, data) => api.put(`/iam/groups/${id}`, data);
export const deleteGroup = (id) => api.delete(`/iam/groups/${id}`);
export const addGroupMember = (groupId, userId) => api.post(`/iam/groups/${groupId}/members`, { userId });
export const removeGroupMember = (groupId, userId) => api.delete(`/iam/groups/${groupId}/members/${userId}`);
export const attachGroupPolicy = (groupId, policyId) => api.post(`/iam/groups/${groupId}/policies`, { policyId });
export const detachGroupPolicy = (groupId, policyId) => api.delete(`/iam/groups/${groupId}/policies/${policyId}`);

// Users
export const listUsers = () => api.get('/iam/users');
export const createUser = (data) => api.post('/iam/users', data);
export const getUser = (id) => api.get(`/iam/users/${id}`);
export const getEffectivePermissions = (id) => api.get(`/iam/users/${id}/effective-permissions`);
export const attachUserPolicy = (userId, policyId) => api.post(`/iam/users/${userId}/policies`, { policyId });
export const detachUserPolicy = (userId, policyId) => api.delete(`/iam/users/${userId}/policies/${policyId}`);
export const setUserBoundary = (userId, policyId) => api.put(`/iam/users/${userId}/boundary`, { policyId });
export const deleteUserBoundary = (userId) => api.delete(`/iam/users/${userId}/boundary`);

// Resource actions (dashboard)
export const callResourceAction = (method, url) => api.request({ method, url });
