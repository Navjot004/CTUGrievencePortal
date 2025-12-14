import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import StudentWelfare from "./pages/StudentWelfare";
import Admission from "./pages/Admission";
import Accounts from "./pages/Accounts";
import Examination from "./pages/Examination";
import Department from "./pages/Department"; // ✅ NEW

// Staff Pages
import StaffDashboard from "./pages/StaffDashboard";
import AdminStaffDashboard from "./pages/AdminStaffDashboard";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard"; 
import AccountAdminDashboard from "./pages/AccountAdminDashboard";
import StudentWelfareAdminDashboard from "./pages/StudentWelfareAdminDashboard";
import AdmissionAdminDashboard from "./pages/AdmissionAdminDashboard";
import ExaminationAdminDashboard from "./pages/ExaminationAdminDashboard";
import AdminManageStaff from "./pages/AdminManageStaff";

// ✅ Import New School Admin Dashboard
import SchoolAdminDashboard from "./pages/SchoolAdminDashboard"; 

function ProtectedRoute({ children, allowedRoles }) {
  const storedRole = localStorage.getItem("grievance_role");
  const storedId = localStorage.getItem("grievance_id");

  const role = storedRole ? storedRole.toLowerCase() : null;
  const id = storedId ? storedId.toUpperCase() : null;

  if (!role || !id) return <Navigate to="/" replace />;

  // ✅ DEFINE ALL ADMINS AND THEIR ROUTES
  const adminRoutes = {
    // Core Admins
    ADM01: "/admin/dashboard",
    ADM_ACCOUNT: "/admin/account",
    ADM_WELFARE: "/admin/studentwelfare",
    ADM_ADMISSION: "/admin/admission",
    ADM_EXAM: "/admin/examination",
    
    // School HODs (All go to the same dynamic component)
    ADM_ENG: "/admin/school",
    ADM_MGMT: "/admin/school",
    ADM_HOTEL: "/admin/school",
    ADM_LAW: "/admin/school",
    ADM_PHARMA: "/admin/school",
    ADM_DESIGN: "/admin/school",
    ADM_HEALTH: "/admin/school",
    ADM_SOCIAL: "/admin/school",
  };

  if (!allowedRoles.includes(role)) {
    if (role === "student") return <Navigate to="/student/dashboard" replace />;
    
    if (role === "staff") {
       if (window.location.pathname.startsWith("/staff/")) return children;
       return <Navigate to="/staff/general" replace />;
    }
    
    if (role === "admin") {
      return <Navigate to={adminRoutes[id] || "/admin/dashboard"} replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  // Admin Routing Check
  if (role === "admin") {
    const intendedDashboard = adminRoutes[id];
    if (intendedDashboard && id !== "ADM01") {
       const currentPath = window.location.pathname.toLowerCase();
       const targetDashboard = intendedDashboard.toLowerCase();
       if (!currentPath.includes("manage-staff") && currentPath !== targetDashboard) {
         return <Navigate to={intendedDashboard} replace />;
       }
    }
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/welfare" element={<ProtectedRoute allowedRoles={["student"]}><StudentWelfare /></ProtectedRoute>} />
        <Route path="/student/admission" element={<ProtectedRoute allowedRoles={["student"]}><Admission /></ProtectedRoute>} />
        <Route path="/student/accounts" element={<ProtectedRoute allowedRoles={["student"]}><Accounts /></ProtectedRoute>} />
        <Route path="/student/examination" element={<ProtectedRoute allowedRoles={["student"]}><Examination /></ProtectedRoute>} />
        <Route path="/student/department" element={<ProtectedRoute allowedRoles={["student"]}><Department /></ProtectedRoute>} />

        {/* Staff Routes */}
        <Route path="/staff/general" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/administration" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/finance" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/facilities" element={<ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/admin" element={<ProtectedRoute allowedRoles={["staff"]}><AdminStaffDashboard /></ProtectedRoute>} />
        <Route path="/staff" element={<Navigate to="/staff/general" replace />} />
        <Route path="/staff/dashboard" element={<Navigate to="/staff/general" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/account" element={<ProtectedRoute allowedRoles={["admin"]}><AccountAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/studentwelfare" element={<ProtectedRoute allowedRoles={["admin"]}><StudentWelfareAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/admission" element={<ProtectedRoute allowedRoles={["admin"]}><AdmissionAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/examination" element={<ProtectedRoute allowedRoles={["admin"]}><ExaminationAdminDashboard /></ProtectedRoute>} />
        
        {/* ✅ SINGLE ROUTE FOR ALL SCHOOL ADMINS */}
        <Route path="/admin/school" element={<ProtectedRoute allowedRoles={["admin"]}><SchoolAdminDashboard /></ProtectedRoute>} /> 
        
        <Route path="/admin/manage-staff" element={<ProtectedRoute allowedRoles={["admin"]}><AdminManageStaff /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;