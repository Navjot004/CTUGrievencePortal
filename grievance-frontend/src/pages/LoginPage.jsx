import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/LoginPage.css";

// Agar aapke paas local logo hai, toh niche wali line uncomment karein:
import ctLogo from "../assets/ct-logo.png";
// const ctLogo = "https://upload.wikimedia.org/wikipedia/commons/9/97/CT_University_logo.png"; 

// ----- ICONS -----
// ----- ICONS -----
import { UserIcon, LockIcon, PhoneIcon, KeyIcon, EyeIcon, EyeOffIcon, StudentIcon, StaffIcon, AdminIcon } from "../components/Icons";

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setMessage("Credentials verified! OTP sent.");
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
                    <div className="input-wrapper" style={{ position: 'relative' }}>
                      <span className="icon"><LockIcon /></span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: '40px' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
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
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setMessage(""); setOtp(""); }}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', fontSize: '14px', display: 'block', width: '100%' }}
                  >
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