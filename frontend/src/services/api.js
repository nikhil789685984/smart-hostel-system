const getApiBase = () => {
  if (typeof window === 'undefined') return 'http://localhost:5001/api';
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  if (hostname) {
    return `http://${hostname}:5001/api`;
  }
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

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
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

  // Fees
  getMyFees: () => request('/fees/my-fees'),
  mockPayFee: (data) => request('/fees/pay', { method: 'POST', body: data }),
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
  createStudent: (data) => request('/admin/students', { method: 'POST', body: data }),
  updateStudent: (id, data) => request(`/admin/students/${id}`, { method: 'PUT', body: data }),
  checkoutStudent: (id, data = {}) => request(`/admin/students/${id}/checkout`, { method: 'POST', body: data }),
  reactivateStudent: (id) => request(`/admin/students/${id}/reactivate`, { method: 'POST' }),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),
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
  deleteMarketplaceItem: (id) => request(`/marketplace/${id}`, { method: 'DELETE' })
};


