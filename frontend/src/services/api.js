/**
 * API service — All HTTP calls to the Flask REST API.
 * Uses Vite proxy for /api/* with automatic JWT token attachment.
 */
import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Interceptor: inject token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('college_auth_token') || localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginUser = (credentials) => api.post('/auth/login', credentials).then((r) => r.data);
export const studentLoginUser = (credentials) => api.post('/auth/student-login', credentials).then((r) => r.data);
export const registerUser = (payload) => api.post('/auth/register', payload).then((r) => r.data);
export const logoutUser = () => api.post('/auth/logout').then((r) => r.data);
export const fetchCurrentUser = () => api.get('/auth/me').then((r) => r.data);
export const fetchDemoAccounts = () => api.get('/auth/demo-accounts').then((r) => r.data);
export const fetchUsers = (params = {}) => api.get('/auth/users', { params }).then((r) => r.data);
export const createUser = (payload) => api.post('/auth/users', payload).then((r) => r.data);
export const updateUser = (id, payload) => api.patch(`/auth/users/${id}`, payload).then((r) => r.data);
export const toggleUserActive = (id) => api.patch(`/auth/users/${id}/toggle-active`).then((r) => r.data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`).then((r) => r.data);

// ── Departments ─────────────────────────────────────────────────────────────
export const fetchDepartments = (params = {}) => api.get('/departments', { params }).then((r) => r.data);
export const fetchDepartment = (id) => api.get(`/departments/${id}`).then((r) => r.data);
export const createDepartment = (payload) => api.post('/departments', payload).then((r) => r.data);
export const updateDepartment = (id, payload) => api.patch(`/departments/${id}`, payload).then((r) => r.data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`).then((r) => r.data);
export const fetchDepartmentDashboard = (id) => api.get(`/departments/${id}/dashboard`).then((r) => r.data);

// ── Categories ──────────────────────────────────────────────────────────────
export const fetchCategories = () => api.get('/categories').then((r) => r.data);
export const createCategory = (payload) => api.post('/categories', payload).then((r) => r.data);

// ── Events ──────────────────────────────────────────────────────────────────
export const fetchEvents = (params = {}) => api.get('/events', { params }).then((r) => r.data);
export const fetchEvent = (id) => api.get(`/events/${id}`).then((r) => r.data);
export const fetchEventAvailability = (id) => api.get(`/events/${id}/availability`).then((r) => r.data);
export const createEvent = (payload) => api.post('/events', payload).then((r) => r.data);
export const updateEvent = (id, payload) => api.patch(`/events/${id}`, payload).then((r) => r.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then((r) => r.data);
export const submitEventForApproval = (id) => api.post(`/events/${id}/submit-for-approval`).then((r) => r.data);
export const approveEvent = (id, remarks = '') => api.post(`/events/${id}/approve`, { remarks }).then((r) => r.data);
export const rejectEvent = (id, remarks) => api.post(`/events/${id}/reject`, { remarks }).then((r) => r.data);

// ── Registrations ───────────────────────────────────────────────────────────
export const registerForEvent = (eventId, payload) => api.post(`/events/${eventId}/registrations`, payload).then((r) => r.data);
export const fetchEventRegistrations = (eventId) => api.get(`/events/${eventId}/registrations`).then((r) => r.data);
export const fetchMyRegistrations = () => api.get('/my/registrations').then((r) => r.data);
export const cancelRegistration = (id) => api.patch(`/registrations/${id}/cancel`).then((r) => r.data);
export const exportRegistrationsCSV = (params = {}) => {
  const token = localStorage.getItem('college_auth_token') || localStorage.getItem('admin_token');
  const query = new URLSearchParams(params).toString();
  const url = `/api/registrations/export${query ? '?' + query : ''}`;
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = 'registrations_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    });
};

// ── Attendance ──────────────────────────────────────────────────────────────
export const fetchEventAttendance = (eventId) => api.get(`/events/${eventId}/attendance`).then((r) => r.data);
export const markAttendance = (eventId, payload) => api.post(`/events/${eventId}/attendance`, payload).then((r) => r.data);
export const qrCheckin = (eventId, identifier) => api.post(`/events/${eventId}/attendance/qr-checkin`, { identifier }).then((r) => r.data);

// ── Certificates ────────────────────────────────────────────────────────────
export const fetchEventCertificates = (eventId, params = {}) => api.get(`/events/${eventId}/certificates`, { params }).then((r) => r.data);
export const fetchEventWinnerCertificates = (eventId) => api.get(`/events/${eventId}/winner-certificates`).then((r) => r.data);
export const generateCertificates = (eventId, payload = {}) => api.post(`/events/${eventId}/certificates`, payload).then((r) => r.data);
export const generateWinnerCertificates = (eventId, payload = {}) => api.post(`/events/${eventId}/winner-certificates`, payload).then((r) => r.data);
export const fetchMyCertificates = () => api.get('/my/certificates').then((r) => r.data);
export const verifyCertificate = (number) => api.get(`/certificates/${number}/verify`).then((r) => r.data);


// ── Notifications & Announcements ───────────────────────────────────────────
export const fetchNotifications = () => api.get('/notifications').then((r) => r.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () => api.post('/notifications/mark-all-read').then((r) => r.data);
export const fetchAnnouncements = (params = {}) => api.get('/announcements', { params }).then((r) => r.data);
export const createAnnouncement = (payload) => api.post('/announcements', payload).then((r) => r.data);

// ── Calendar ────────────────────────────────────────────────────────────────
export const fetchCalendarEvents = (params = {}) => api.get('/calendar/events', { params }).then((r) => r.data);

// ── Feedback & Results ──────────────────────────────────────────────────────
export const fetchEventFeedback = (eventId) => api.get(`/events/${eventId}/feedback`).then((r) => r.data);
export const submitEventFeedback = (eventId, payload) => api.post(`/events/${eventId}/feedback`, payload).then((r) => r.data);
export const fetchEventResults = (eventId) => api.get(`/events/${eventId}/results`).then((r) => r.data);
export const publishEventResults = (eventId, payload) => api.post(`/events/${eventId}/results`, payload).then((r) => r.data);

// ── Bookmarks ───────────────────────────────────────────────────────────────
export const fetchMyBookmarks = () => api.get('/my/bookmarks').then((r) => r.data);
export const addBookmark = (eventId) => api.post(`/events/${eventId}/bookmark`).then((r) => r.data);
export const removeBookmark = (eventId) => api.delete(`/events/${eventId}/bookmark`).then((r) => r.data);

// ── Dashboard & Reports ─────────────────────────────────────────────────────
export const fetchInstitutionDashboard = () => api.get('/admin/dashboard').then((r) => r.data);
export const fetchAuditLogs = (params = {}) => api.get('/audit-logs', { params }).then((r) => r.data);
export const exportMasterReport = (type = 'events') => {
  const token = localStorage.getItem('college_auth_token') || localStorage.getItem('admin_token');
  const url = `/api/reports/export?type=${type}`;
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const a = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = `${type}_master_report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    });
};

export default api;
