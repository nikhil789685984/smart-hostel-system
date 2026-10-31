const getApiBase = () => {
  return '/api';
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('apex_hostel_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !options.isFormData) {
    config.body = JSON.stringify(options.body);
  } else if (options.isFormData) {
    config.body = options.body;
    delete config.headers['Content-Type']; // Let browser set boundary
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  globalSearch: (q) => request(`/admin/global-search?q=${encodeURIComponent(q)}`),
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getProfile: () => request('/auth/profile'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),

  // Student Dashboard
  getStudentDashboard: () => request('/student/dashboard'),

  // Room Management
  getRoomOverview: () => request('/rooms/overview'),
  getRoomMatrix: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rooms/matrix${query ? `?${query}` : ''}`);
  },
  getStudentRoom: () => request('/rooms/my-room'),
  requestRoomChange: (data) => request('/rooms/change-request', { method: 'POST', body: data }),
  allocateBed: (studentId, bedId) => request('/rooms/allocate', { method: 'POST', body: { studentId, bedId } }),
  vacateBed: (bedId) => request('/rooms/vacate', { method: 'POST', body: { bedId } }),
  addRoom: (roomData) => request('/rooms/add', { method: 'POST', body: roomData }),
  cancelRoomAllocation: (data) => request('/rooms/cancel-allocation', { method: 'POST', body: data }),
  cancelRoomChangeRequest: (id) => request(id ? `/rooms/change-requests/${id}` : '/rooms/change-request/cancel', { method: id ? 'DELETE' : 'POST' }),
  getRoomChangeRequests: () => request('/rooms/change-requests'),
  updateRoomChangeRequest: (id, data) => request(`/rooms/change-requests/${id}`, { method: 'PATCH', body: data }),


  // Complaint Management
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },
  getComplaintDetails: (id) => request(`/complaints/${id}`),
  createComplaint: (data) => request('/complaints', { method: 'POST', body: data }),
  aiTriageComplaint: (data) => request('/complaints/ai-triage', { method: 'POST', body: data }),
  updateComplaintStatus: (id, data) => request(`/complaints/${id}/status`, { method: 'PATCH', body: data }),
  addComplaintUpdate: (id, text) => request(`/complaints/${id}/updates`, { method: 'POST', body: { update_text: text } }),
  getWardensList: () => request('/complaints/wardens-list'),
  submitWardenComplaint: (data) => request('/complaints/warden-escalation', { method: 'POST', body: data }),
  getMyWardenComplaints: () => request('/complaints/warden-escalation'),
  getAdminWardenComplaints: () => request('/admin/warden-complaints'),
  submitMessComplaint: (data) => request('/complaints/mess', { method: 'POST', body: data }),
  getMyMessComplaints: () => request('/complaints/mess'),
  getAdminMessComplaints: () => request('/admin/mess-complaints'),

  // Mess Management
  getTodayMessMenu: () => request('/mess/today'),
  getWeeklyMessMenu: () => request('/mess/weekly'),
  getMessAnalytics: () => request('/mess/analytics'),
  submitMessFeedback: (feedback) => request('/mess/feedback', { method: 'POST', body: feedback }),
  updateMessMenu: (menuData) => request('/mess/menu', { method: 'PUT', body: menuData }),
  toggleMealAbsence: (data) => request('/mess/absence/toggle', { method: 'POST', body: data }),
  getMyMealAbsences: () => request('/mess/absence/my'),
  getWardenMessRoster: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/mess/roster/warden${query ? `?${query}` : ''}`);
  },
  getAdminMessAnalytics: () => request('/mess/analytics/admin'),

  // Notices
  getNotices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notices${query ? `?${query}` : ''}`);
  },
  createNotice: (data) => request('/notices', { method: 'POST', body: data }),
  updateNotice: (id, data) => request(`/notices/${id}`, { method: 'PUT', body: data }),
  deleteNotice: (id) => request(`/notices/${id}`, { method: 'DELETE' }),
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('apex_hostel_token');
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Upload failed with status ${res.status}`);
    return data;
  },

  // Fees
  getMyFees: () => request('/fees/my-fees'),
  mockPayFee: (data) => request('/fees/pay', { method: 'POST', body: data }),
  
  getAIDefaulters: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/fees/ai-defaulters${query ? `?${query}` : ''}`);
  },
  sendTargetedDefaulterAlert: (data) => request('/fees/alert-targeted-defaulters', { method: 'POST', body: data }),
  getAllFees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/fees/all${query ? `?${query}` : ''}`);
  },

  // Gate Passes
  applyGatePass: (data) => request('/gate-passes/apply', { method: 'POST', body: data }),
  getMyGatePasses: () => request('/gate-passes/my-passes'),
  updateMyGatePass: (id, data) => request(`/gate-passes/${id}`, { method: 'PUT', body: data }),
  cancelGatePass: (id) => request(`/gate-passes/${id}`, { method: 'DELETE' }),
  getAllGatePasses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/gate-passes/all${query ? `?${query}` : ''}`);
  },
  updateGatePassStatus: (id, data) => request(`/gate-passes/${id}/status`, { method: 'PATCH', body: data }),

  // Analytics
  getHostelAnalytics: () => request('/analytics'),

  // AI Assistant & Classifier
  aiClassify: (data) => request('/ai/classify', { method: 'POST', body: data }),
  aiChat: (message) => request('/ai/chat', { method: 'POST', body: { message } }),

  // Admin Management & Checkout
  getAdminStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/students${query ? `?${query}` : ''}`);
  },
  getStudentHistory: (studentId) => request(`/admin/student-history/${studentId}`),
  createStudent: (data) => request('/admin/students', { method: 'POST', body: data }),
  updateStudent: (id, data) => request(`/admin/students/${id}`, { method: 'PUT', body: data }),
  checkoutStudent: (id, data = {}) => request(`/admin/students/${id}/checkout`, { method: 'POST', body: data }),
  reactivateStudent: (id) => request(`/admin/students/${id}/reactivate`, { method: 'POST' }),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
  removeStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
  submitCheckoutRequest: (data) => request('/admin/students/checkout-request', { method: 'POST', body: data }),
  getMyCheckoutRequest: () => request('/admin/students/checkout-request'),
  cancelCheckoutRequest: (id) => request(id ? `/admin/students/checkout-requests/${id}` : '/admin/students/checkout-request', { method: 'DELETE' }),
  getCheckoutRequests: () => request('/admin/students/checkout-requests'),
  processCheckoutRequest: (id, data) => request(`/admin/students/checkout-requests/${id}/process`, { method: 'POST', body: data }),

  getAdminWardens: () => request('/admin/wardens'),
  getAdminHostels: () => request('/admin/hostels'),

  // Staff Messages & Comms (Warden <-> Admin)
  getStaffContacts: () => request('/messages/contacts'),
  getStaffConversation: (contactId) => request(`/messages/conversation/${contactId}`),
  sendStaffMessage: (data) => request('/messages/send', { method: 'POST', body: data }),
  markStaffMessageRead: (id) => request(`/messages/${id}/read`, { method: 'PATCH' }),

  // Real-Time Notifications Center
  getMyNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // Late Fees & Disciplinary Fines
  assessLateFines: () => request('/fees/assess-fines', { method: 'POST' }),
  assessIndividualLateFine: (studentId, data = {}) => request(`/fees/assess-individual-fine/${studentId}`, { method: 'POST', body: data }),
  getAllFines: () => request('/fees/fines'),
  waiveFine: (id) => request(`/fees/fines/${id}/waive`, { method: 'PATCH' }),
  issueDisciplinaryFine: (data) => request('/fees/fines/issue', { method: 'POST', body: data }),
  sendFeeAlertToDefaulters: () => request('/fees/alert-defaulters', { method: 'POST' }),
  sendFeeAlertToStudent: (studentId, data = {}) => request(`/fees/alert-student/${studentId}`, { method: 'POST', body: data }),

  // Official Razorpay Gateway Integration
  createRazorpayOrder: (data) => request('/fees/razorpay/create-order', { method: 'POST', body: data }),
  verifyRazorpayPayment: (data) => request('/fees/razorpay/verify-payment', { method: 'POST', body: data }),

  // Salary routes
  getStaffAccount: () => request('/salary/my-account'),
  processGlobalSalary: () => request('/salary/process-all', { method: 'POST' }),

  // Hostel Leaderboard & Friendly Competitions
  getLeaderboard: () => request('/leaderboard/blocks'),
  submitInspection: (data) => request('/leaderboard/inspection', { method: 'POST', body: data }),

  // Hostel Mini Marketplace
  getMarketplaceItems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/marketplace${query ? `?${query}` : ''}`);
  },
  createMarketplaceItem: (data) => request('/marketplace', { method: 'POST', body: data }),
  updateMarketplaceItemStatus: (id, status) => request(`/marketplace/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteMarketplaceItem: (id) => request(`/marketplace/${id}`, { method: 'DELETE' }),

  // Eco-Warrior Features
  getEcoLeaderboard: () => request(`/eco/leaderboard?t=${Date.now()}`),
  getMyEcoStats: () => request(`/eco/my-stats?t=${Date.now()}`),
  claimEcoReward: () => request('/eco/claim-reward', { method: 'POST' }),

  // Night Canteen
  getCanteenMenu: () => request('/canteen/menu'),
  placeCanteenOrder: (data) => request('/canteen/order', { method: 'POST', body: data }),
  getMyCanteenOrders: () => request('/canteen/my-orders'),
  getAllCanteenOrders: () => request('/canteen/all-orders'),
  // Guest Passes
  bookGuestPass: (data) => request('/guest', { method: 'POST', body: data }),
  getMyGuestPasses: () => request('/guest'),
  payForGuestPass: (id, payment_method) => request(`/guest/${id}/pay`, { method: 'POST', body: { payment_method } }),
  getAllGuestPasses: () => request('/guest/all'),
  updateGuestPassStatus: (id, status, allocated_room = null) => request(`/guest/${id}/status`, { method: 'PATCH', body: { status, allocated_room } }),
  
  // Scanner
  verifyPassForScanner: (type, id) => request(`/scanner/verify?type=${type}&id=${id}`),
  processScanAction: (type, id, action) => request('/scanner/action', { method: 'POST', body: { type, id, action } }),
  // Lost & Found
  getLostFoundItems: (type, status) => {
    let url = '/lost-found?';
    if (type) url += `type=${type}&`;
    if (status) url += `status=${status}&`;
    return request(url);
  },
  reportLostFoundItem: (data) => request('/lost-found', { method: 'POST', body: data }),
  claimFoundItem: (id, claim_proof) => request(`/lost-found/${id}/claim`, { method: 'POST', body: { claim_proof } }),
  resolveLostFoundClaim: (id, action) => request(`/lost-found/${id}/resolve`, { method: 'PATCH', body: { action } }),
  getCommandCenterStats: () => request('/admin/command-center'),
  receiveParcel: (data) => request('/parcels/receive', { method: 'POST', body: data }),
  getAllParcels: () => request('/parcels'),
  getMyParcels: () => request('/parcels/my-parcels'),
  verifyAndCollectParcel: (id, otp) => request(`/parcels/${id}/verify`, { method: 'POST', body: { otp } }),

  // Generic HTTP helpers
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),

  // Study Hub Complete Suite
  getStudySubjects: () => request('/study-hub/subjects'),
  createStudySubject: (data) => request('/study-hub/subjects', { method: 'POST', body: data }),
  updateStudySubject: (id, data) => request(`/study-hub/subjects/${id}`, { method: 'PUT', body: data }),
  deleteStudySubject: (id) => request(`/study-hub/subjects/${id}`, { method: 'DELETE' }),

  getStudyMaterials: (params = {}) => {
    const q = new URLSearchParams();
    if (params.subject_id) q.append('subject_id', params.subject_id);
    if (params.type) q.append('type', params.type);
    if (params.search) q.append('search', params.search);
    const queryString = q.toString() ? `?${q.toString()}` : '';
    return request(`/study-hub/materials${queryString}`);
  },
  uploadStudyMaterial: (data) => request('/study-hub/materials', { method: 'POST', body: data }),
  updateStudyMaterial: (id, data) => request(`/study-hub/materials/${id}`, { method: 'PUT', body: data }),
  deleteStudyMaterial: (id) => request(`/study-hub/materials/${id}`, { method: 'DELETE' }),
  toggleStudyMaterialFavorite: (id) => request(`/study-hub/materials/${id}/favorite`, { method: 'PATCH' }),

  // Student Mental Wellness & Depression Screening Test
  getWellnessQuestions: () => request('/wellness/questions'),
  submitDepressionTest: (data) => request('/wellness/depression-test', { method: 'POST', body: data }),
  getMyWellnessScreenings: () => request('/wellness/my-screenings'),
  getAdminWellnessScreenings: (params = {}) => {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.severity) q.append('severity', params.severity);
    if (params.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/wellness/admin/screenings${qs}`);
  },
  approveWellnessSession: (id, data) => request(`/wellness/admin/screenings/${id}/approve`, { method: 'POST', body: data }),
  getEmailAuditLogs: () => request('/wellness/admin/email-logs'),
  trackWellnessStatus: (query) => request(`/wellness/track?query=${encodeURIComponent(query)}`),
};

export default api;

export { API_BASE };
