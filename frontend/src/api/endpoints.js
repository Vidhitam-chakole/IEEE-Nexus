import api from './client';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  registerStudent: (data) => api.post('/auth/register-student', data),
};

export const teamsApi = {
  createTeam: (name, project_title) => api.post('/teams', { name, project_title }),
  joinTeam: (code) => api.post('/teams/join', { code }),
  getMyTeam: () => api.get('/teams/my-team'),
  lockTeam: () => api.post('/teams/my-team/lock'),
  submitPreferences: (preferences) => api.post('/teams/my-team/preferences', { preferences }),
  getGuidesList: () => api.get('/teams/guides-list'),
};

export const allocationApi = {
  runAllocation: (priorityMode = 'cgpa') => api.post(`/allocation/run?priority_mode=${priorityMode}`),
  getResults: () => api.get('/allocation/results'),
  override: (team_id, guide_id, reason) => api.post('/allocation/override', { team_id, guide_id, reason }),
  reset: () => api.post('/allocation/reset'),
};

export const reviewsApi = {
  listReviews: () => api.get('/reviews'),
  createReview: (data) => api.post('/reviews', data),
  autoSchedule: (reviewId, data) => api.post(`/reviews/${reviewId}/auto-schedule`, data),
  getSlots: (reviewId, params) => api.get(`/reviews/${reviewId}/slots`, { params }),
  rescheduleSlot: (slotId, data) => api.put(`/reviews/slots/${slotId}/reschedule`, data),
};

export const logsApi = {
  submitLog: (data) => api.post('/logs', data),
  getTeamLogs: (teamId) => api.get(`/logs/team/${teamId}`),
  reviewLog: (logId, status, guide_feedback) => api.put(`/logs/${logId}/review`, { status, guide_feedback }),
};

export const documentsApi = {
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTeamDocuments: (teamId) => api.get(`/documents/team/${teamId}`),
  checkSimilarity: (docId) => api.post(`/documents/similarity-stub/${docId}`),
  getDownloadUrl: (docId) => `/api/v1/documents/download/${docId}`,
};

export const submissionsApi = {
  submitFinal: (data) => api.post('/submissions', data),
  getTeamSubmission: (teamId) => api.get(`/submissions/team/${teamId}`),
  updateStatus: (subId, status, coordinator_feedback) => api.put(`/submissions/${subId}/status`, { status, coordinator_feedback }),
};

export const coordinatorApi = {
  getDashboard: () => api.get('/coordinator/dashboard'),
  getHeatmap: () => api.get('/coordinator/heatmap'),
  updateCapacity: (guideId, max_teams) => api.put(`/coordinator/guides/${guideId}/capacity`, { max_teams }),
};

export const internshipsApi = {
  submitRequest: (data) => api.post('/internships', data),
  getMyRequests: () => api.get('/internships/my-requests'),
  getAllRequests: () => api.get('/internships/all'),
  reviewByGuide: (reqId, status, comment) => api.put(`/internships/${reqId}/guide-review`, { status, comment }),
  reviewByCoordinator: (reqId, status, comment) => api.put(`/internships/${reqId}/coordinator-review`, { status, comment }),
};
