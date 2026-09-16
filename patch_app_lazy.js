const fs = require('fs');

const code = `
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Navigation & Layout (Eager Load for instant visual feedback)
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy Loaded Pages for extreme performance boost
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentRoom = lazy(() => import('./pages/student/StudentRoom'));
const StudentComplaints = lazy(() => import('./pages/student/StudentComplaints'));
const StudentMess = lazy(() => import('./pages/student/StudentMess'));
const StudentGatePass = lazy(() => import('./pages/student/StudentGatePass'));
const StudentFees = lazy(() => import('./pages/student/StudentFees'));
const StudentAssistant = lazy(() => import('./pages/student/StudentAssistant'));
const StudentNotices = lazy(() => import('./pages/student/StudentNotices'));
const ReportWarden = lazy(() => import('./pages/student/ReportWarden'));
const ReportMess = lazy(() => import('./pages/student/ReportMess'));

const WardenDashboard = lazy(() => import('./pages/warden/WardenDashboard'));
const RoomAllocation = lazy(() => import('./pages/warden/RoomAllocation'));
const ComplaintManagement = lazy(() => import('./pages/warden/ComplaintManagement'));
const AdminComplaintDetails = lazy(() => import('./pages/admin/AdminComplaintDetails'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageStudents = lazy(() => import('./pages/admin/ManageStudents'));
const ManageWardens = lazy(() => import('./pages/admin/ManageWardens'));
const ManageRooms = lazy(() => import('./pages/admin/ManageRooms'));
const SmartAnalytics = lazy(() => import('./pages/admin/SmartAnalytics'));

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Authenticating Secure Session...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <Outlet />;
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50/50 flex overflow-hidden font-sans relative">
      {/* Animated Abstract UI Background for absolute premium feel */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px]" />
      </div>

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col w-full min-w-0 relative z-10 transition-all duration-300">
        <Navbar toggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 h-full">
            <Suspense fallback={
              <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Module...</p>
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* App Shell with Sidebar */}
          <Route element={<Layout />}>
            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/room" element={<StudentRoom />} />
              <Route path="/student/complaints" element={<StudentComplaints />} />
              <Route path="/student/complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="/student/mess" element={<StudentMess />} />
              <Route path="/student/gate-pass" element={<StudentGatePass />} />
              <Route path="/student/fees" element={<StudentFees />} />
              <Route path="/student/ai-assistant" element={<StudentAssistant />} />
              <Route path="/student/notices" element={<StudentNotices />} />
              <Route path="/student/report-warden" element={<ReportWarden />} />
              <Route path="/student/report-mess" element={<ReportMess />} />
            </Route>
            
            {/* Warden Routes */}
            <Route element={<ProtectedRoute allowedRoles={['warden']} />}>
              <Route path="/warden/dashboard" element={<WardenDashboard />} />
              <Route path="/warden/allocations" element={<RoomAllocation />} />
              <Route path="/warden/complaints" element={<ComplaintManagement />} />
              <Route path="/warden/complaints/:id" element={<AdminComplaintDetails />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<ManageStudents />} />
              <Route path="/admin/wardens" element={<ManageWardens />} />
              <Route path="/admin/rooms" element={<ManageRooms />} />
              <Route path="/admin/analytics" element={<SmartAnalytics />} />
              <Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
`;

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('App.jsx refactored with lazy loading and advanced UI');
