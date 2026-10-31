import React, { useState, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

// Navigation & Layout
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import MobileBottomNav from "./components/layout/MobileBottomNav";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Student Pages
const StudyHub = lazy(() => import("./pages/student/StudyHub"));
const FeeGovernance = lazy(() => import("./pages/admin/FeeGovernance"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentRoom = lazy(() => import("./pages/student/StudentRoom"));
const StudentComplaints = lazy(() => import("./pages/student/StudentComplaints"));
const StudentMess = lazy(() => import("./pages/student/StudentMess"));
const StudentGatePass = lazy(() => import("./pages/student/StudentGatePass"));
const StudentFees = lazy(() => import("./pages/student/StudentFees"));
const StudentAssistant = lazy(() => import("./pages/student/StudentAssistant"));
const StudentRickshaw = lazy(() => import("./pages/student/StudentRickshaw"));
const StudentNotices = lazy(() => import("./pages/student/StudentNotices"));
const ReportWarden = lazy(() => import("./pages/student/ReportWarden"));
const ReportMess = lazy(() => import("./pages/student/ReportMess"));
const LostAndFound = lazy(() => import("./pages/student/LostAndFound"));
const StudentParcels = lazy(() => import("./pages/student/StudentParcels"));
const WellnessHub = lazy(() => import("./pages/student/WellnessHub"));
const WellnessManagement = lazy(() => import("./pages/admin/WellnessManagement"));

// Warden Pages
const WardenDashboard = lazy(() => import("./pages/warden/WardenDashboard"));
const RoomAllocation = lazy(() => import("./pages/warden/RoomAllocation"));
const ComplaintManagement = lazy(() => import("./pages/warden/ComplaintManagement"));
const GatePassManagement = lazy(() => import("./pages/warden/GatePassManagement"));
const RoomRequests = lazy(() => import("./pages/warden/RoomRequests"));
const MessManagement = lazy(() => import("./pages/warden/MessManagement"));
const NoticeManagement = lazy(() => import("./pages/warden/NoticeManagement"));
const WardenAnalytics = lazy(() => import("./pages/warden/WardenAnalytics"));
const HostelCheckoutRequests = lazy(() => import("./pages/warden/HostelCheckoutRequests"));
const ManageGuestPasses = lazy(() => import("./pages/warden/ManageGuestPasses"));
const SecurityScanner = lazy(() => import("./pages/warden/SecurityScanner"));
const ManageLostFound = lazy(() => import("./pages/warden/ManageLostFound"));
const ManageParcels = lazy(() => import("./pages/warden/ManageParcels"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const GlobalSearch = lazy(() => import("./pages/admin/GlobalSearch"));
const FileVideoShare = lazy(() => import("./pages/admin/FileVideoShare"));
const VideoCallCenter = lazy(() => import("./pages/admin/VideoCallCenter"));

const ManageStudents = lazy(() => import("./pages/admin/ManageStudents"));
const StudentHistory = lazy(() => import("./pages/admin/StudentHistory"));
const ManageWardens = lazy(() => import("./pages/admin/ManageWardens"));
const ManageRooms = lazy(() => import("./pages/admin/ManageRooms"));
const SmartAnalytics = lazy(() => import("./pages/admin/SmartAnalytics"));
const AdminComplaintDetails = lazy(() => import("./pages/admin/AdminComplaintDetails"));
const AdminCommandCenter = lazy(() => import("./pages/admin/AdminCommandCenter"));

// Common Staff Pages
const StaffMessages = lazy(() => import("./pages/common/StaffMessages"));
const HostelLeaderboard = lazy(() => import("./pages/shared/HostelLeaderboard"));
const HostelMarketplace = lazy(() => import("./pages/shared/HostelMarketplace"));
const LiveNoiseHeatmap = lazy(() => import("./pages/shared/LiveNoiseHeatmap"));
const EcoLeaderboard = lazy(() => import("./pages/shared/EcoLeaderboard"));
const NightCanteen = lazy(() => import("./pages/student/NightCanteen"));
const GuestPass = lazy(() => import("./pages/student/GuestPass"));



const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Authenticating Secure Session...</p>
      </div>
    );
  }
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <LandingPage />;
};

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
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  
  return <Outlet />;
};

const CatchAllRoute = () => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <Navigate to="/" replace />;
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full bg-slate-50/50 flex overflow-hidden font-sans relative">
      {/* Animated Abstract UI Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-400/10 blur-[100px]" />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col w-full min-w-0 relative z-10 transition-all duration-300">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth lg:pl-64 pb-20 md:pb-6">
          <div className="max-w-[1600px] mx-auto p-3 sm:p-6 lg:p-8 min-h-full">
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

        {/* Thumb-Accessible Mobile Bottom Navigation */}
        <MobileBottomNav
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />
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
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/depression-test" element={<WellnessHub />} />
          <Route path="/wellness" element={<WellnessHub />} />
          
          {/* App Shell with Sidebar */}
          <Route element={<Layout />}>
            {/* Global Role Aliases */}
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/warden" element={<Navigate to="/warden/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="/student/study-hub" element={<StudyHub />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/room" element={<StudentRoom />} />
              <Route path="/student/complaints" element={<StudentComplaints />} />
              <Route path="/student/complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="/student/mess" element={<StudentMess />} />
              <Route path="/student/gate-pass" element={<StudentGatePass />} />
              <Route path="/student/fees" element={<StudentFees />} />
              <Route path="/student/ai-assistant" element={<StudentAssistant />} />
              <Route path="/student/rickshaw" element={<StudentRickshaw />} />
              <Route path="/student/assistant" element={<Navigate to="/student/ai-assistant" replace />} />
              <Route path="/student/notices" element={<StudentNotices />} />
              <Route path="/student/report-warden" element={<ReportWarden />} />
              <Route path="/student/report-mess" element={<ReportMess />} />
              <Route path="/student/leaderboard" element={<HostelLeaderboard />} />
              <Route path="/student/wellness" element={<WellnessHub />} />
            </Route>
            
            {/* Warden Routes */}
            <Route element={<ProtectedRoute allowedRoles={["warden"]} />}>
              <Route path="/warden/fees" element={<FeeGovernance />} />
              <Route path="/warden/dashboard" element={<WardenDashboard />} />
              <Route path="/warden/students" element={<ManageStudents />} />
              <Route path="/warden/checkout-requests" element={<HostelCheckoutRequests />} />
              <Route path="/warden/allocations" element={<RoomAllocation />} />
              <Route path="/warden/allocation" element={<Navigate to="/warden/allocations" replace />} />
              <Route path="/warden/complaints" element={<ComplaintManagement />} />
              <Route path="/warden/complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="/warden/gate-passes" element={<GatePassManagement />} />
              <Route path="/warden/guest-passes" element={<ManageGuestPasses />} />
              <Route path="/warden/lost-found" element={<ManageLostFound />} />
              <Route path="/warden/parcels" element={<ManageParcels />} />
              <Route path="/warden/scanner" element={<SecurityScanner />} />
              <Route path="/warden/room-requests" element={<RoomRequests />} />
              <Route path="/warden/mess" element={<MessManagement />} />
              <Route path="/warden/notices" element={<NoticeManagement />} />
              <Route path="/warden/analytics" element={<WardenAnalytics />} />
              <Route path="/warden/messages" element={<StaffMessages />} />
              <Route path="/warden/leaderboard" element={<HostelLeaderboard />} />
              <Route path="/warden/wellness" element={<WellnessManagement />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/fees" element={<FeeGovernance />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              <Route path="/admin/command-center" element={<AdminCommandCenter />} />
              <Route path="/admin/parcels" element={<ManageParcels />} />
              <Route path="/admin/students" element={<ManageStudents />} />
              <Route path="/admin/student-history" element={<StudentHistory />} />
              <Route path="/admin/checkout-requests" element={<HostelCheckoutRequests />} />
              <Route path="/admin/wardens" element={<ManageWardens />} />
              <Route path="/admin/rooms" element={<ManageRooms />} />
              <Route path="/admin/allocations" element={<RoomAllocation />} />
              <Route path="/admin/analytics" element={<SmartAnalytics />} />
              <Route path="/admin/complaints" element={<ComplaintManagement />} />
              <Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="/admin/mess" element={<MessManagement />} />
              <Route path="/admin/notices" element={<NoticeManagement />} />
              <Route path="/admin/gate-passes" element={<GatePassManagement />} />
              <Route path="/admin/guest-passes" element={<ManageGuestPasses />} />
              <Route path="/admin/messages" element={<StaffMessages />} />
              <Route path="/admin/leaderboard" element={<HostelLeaderboard />} />
              <Route path="/admin/wellness" element={<WellnessManagement />} />
            </Route>
            
            {/* Shared Routes */}
            <Route element={<ProtectedRoute allowedRoles={["student", "warden", "admin"]} />}>
              <Route path="/study-hub" element={<StudyHub />} />
              <Route path="/admin/study-hub" element={<StudyHub />} />
              <Route path="/warden/study-hub" element={<StudyHub />} />
              <Route path="/noise-heatmap" element={<LiveNoiseHeatmap />} />
              <Route path="/leaderboard" element={<HostelLeaderboard />} />
              <Route path="/marketplace" element={<HostelMarketplace />} />
              <Route path="/eco-leaderboard" element={<EcoLeaderboard />} />
              <Route path="/canteen" element={<NightCanteen />} />
              <Route path="/guest-pass" element={<GuestPass />} />
              <Route path="/student/lost-found" element={<LostAndFound />} />
              <Route path="/student/parcels" element={<StudentParcels />} />
              <Route path="/warden/marketplace" element={<HostelMarketplace />} />
              <Route path="/admin/marketplace" element={<HostelMarketplace />} />
              <Route path="/wellness-hub" element={<WellnessHub />} />
            </Route>


          </Route>
          
          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
