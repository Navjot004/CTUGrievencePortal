import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/LoginPage.css";

// Agar aapke paas local logo hai, toh niche wali line uncomment karein:
import ctLogo from "../assets/ct-logo.png"; 
// const ctLogo = "https://upload.wikimedia.org/wikipedia/commons/9/97/CT_University_logo.png"; 

// ----- ICONS -----
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const LockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const PhoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);
const KeyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>);

// ----- ROLE ICONS -----
const StudentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v16H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="m5 12 4-2 4 2"></path><path d="m19 18 2 2 2-2"></path></svg>);
const StaffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>);
const AdminIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>);

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null); 
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setUserId("");
    setPhone("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
    setMessage("");
    setStatusType("");
  };

  // ✅ Step 1: Verify Password & Send OTP (NO ID VALIDATION)
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // ❌ REMOVED: validateIdForRole() check. 
    // Backend will check if ID exists in Excel records.

    setMessage("Verifying credentials...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          id: userId.toUpperCase(), // Numeric IDs treated as string
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setMessage("✅ Credentials verified! OTP sent.");
      setStatusType("success");
    } catch (err) {
      setMessage(err.message);
      setStatusType("error");
    }
  };

  // ✅ Step 2: Verify OTP and Login (Handles Dynamic Staff Admin)
  const handleVerifyOTPAndPassword = async (e) => {
    e.preventDefault();
    setMessage("Logging in...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId.toUpperCase(),
          otp,
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");

      // Save Data
      localStorage.setItem("grievance_id", data.id.toUpperCase());
      localStorage.setItem("grievance_role", data.role.toLowerCase());
      localStorage.setItem("grievance_token", data.token);
      
      // ✅ Save Admin Flags
      if (data.isDeptAdmin) localStorage.setItem("is_dept_admin", "true");
      else localStorage.removeItem("is_dept_admin");
      
      if (data.adminDepartment) localStorage.setItem("admin_department", data.adminDepartment);
      else localStorage.removeItem("admin_department");

      setMessage("Login successful! Redirecting...");
      setStatusType("success");

      const role = data.role.toLowerCase();
      const isDeptAdmin = data.isDeptAdmin;

      // ✅ Redirect Logic
      setTimeout(() => {
        if (role === "student") {
          navigate("/student/dashboard");
        } 
        else if (role === "staff") {
          // If Promoted Staff (Boss) -> Admin Dashboard View
          if (isDeptAdmin) {
             navigate("/admin/school"); 
          } 
          // If Staff Assigned by Admin -> AdminStaffDashboard
          else if (data.adminDepartment) {
             navigate("/staff/admin");
          } 
          // General Unassigned Staff -> StaffDashboard
          else {
             navigate("/staff/general");
          }
        } 
        else if (role === "admin") {
          // Check for Master Admin
          if (data.id === "10001") {
             navigate("/admin/dashboard");
          } else {
             // Department Admins go to School Dashboard (Common Layout)
             navigate("/admin/school");
          }
        }
      }, 1000);

    } catch (err) {
      setMessage(err.message);
      setStatusType("error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-brand-section">
        <div className="brand-content">
          <img src={ctLogo} alt="University Logo" className="university-logo" />
          <h1>Grievance Portal</h1>
          <p>Secure, transparent, and efficient resolution. Select your role to begin.</p>

          <div className="role-selector">
            <div className={`role-card ${selectedRole === "student" ? "active" : ""}`} onClick={() => handleRoleSelect("student")}>
              <StudentIcon />
              <h3>Student</h3>
            </div>
            <div className={`role-card ${selectedRole === "staff" ? "active" : ""}`} onClick={() => handleRoleSelect("staff")}>
              <StaffIcon />
              <h3>Staff</h3>
            </div>
            <div className={`role-card ${selectedRole === "admin" ? "active" : ""}`} onClick={() => handleRoleSelect("admin")}>
              <AdminIcon />
              <h3>Admin</h3>
            </div>
          </div>
          <div className="brand-footer">© 2025 University Administration</div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="form-wrapper">
          {!selectedRole ? (
            <div className="form-placeholder">
              <h2>Select Your Role</h2>
              <p>Please select your role on the left to activate the form.</p>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2>Welcome Back, {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h2>
                <p>Please login to access your dashboard</p>
              </div>

              {message && <div className={`alert-box ${statusType}`}>{message}</div>}

              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="animated-form">
                  <div className="input-group">
                    <label>{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} ID</label>
                    <div className="input-wrapper">
                      <span className="icon"><UserIcon /></span>
                      {/* ✅ UPDATED PLACEHOLDER to show Numeric Examples */}
                      <input
                        type="text"
                        placeholder={
                          selectedRole === "student" ? "e.g. 72212871" : 
                          selectedRole === "staff" ? "e.g. 25001" : "e.g. 10002"
                        }
                        value={userId}
                        onChange={(e) => setUserId(e.target.value.toUpperCase())}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <span className="icon"><LockIcon /></span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Registered Phone</label>
                    <div className="input-wrapper">
                      <span className="icon"><PhoneIcon /></span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>
                  </div>

                  <button className="btn-primary" type="submit">Verify & Send OTP</button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTPAndPassword} className="animated-form">
                  <div className="otp-header">
                    <p>Enter the OTP sent to <strong>******{phone.slice(-4)}</strong></p>
                  </div>

                  <div className="input-group">
                    <label>One Time Password</label>
                    <div className="input-wrapper">
                      <span className="icon"><KeyIcon /></span>
                      <input
                        type="text"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button className="btn-primary" type="submit">Login</button>
                  <button type="button" className="btn-link" onClick={() => { setOtpSent(false); setMessage(""); }}>
                    Back to details
                  </button>
                </form>
              )}

              <div className="form-footer">
                <p>Don’t have an account? <Link to="/register">Register Here</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;