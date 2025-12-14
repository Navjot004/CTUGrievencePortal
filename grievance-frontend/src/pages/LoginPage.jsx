import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

// ----- ICONS -----
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
const KeyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

// ----- ROLE ICONS -----
const StudentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v16H6.5a2.5 2.5 0 0 1 0-5H20"></path>
    <path d="m5 12 4-2 4 2"></path>
    <path d="m19 18 2 2 2-2"></path>
  </svg>
);
const StaffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);
const AdminIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null); // 'student', 'staff', or 'admin'
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  const navigate = useNavigate();

  // Reset form when role changes
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

  // ✅ Validation logic for ID based on role
  const validateIdForRole = (id) => {
    const upperId = id.toUpperCase();
    if (selectedRole === "student" && !upperId.startsWith("STU")) {
      setMessage("Invalid ID. Student IDs must start with 'STU'.");
      return false;
    }
    if (selectedRole === "staff" && !upperId.startsWith("STF")) {
      setMessage("Invalid ID. Staff IDs must start with 'STF'.");
      return false;
    }
    if (selectedRole === "admin" && !upperId.startsWith("ADM")) {
      setMessage("Invalid ID. Admin IDs must start with 'ADM'.");
      return false;
    }
    return true;
  };

  // ✅ Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!validateIdForRole(userId)) {
      setStatusType("error");
      return;
    }

    setMessage("Sending OTP...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole, // Use selected role
          id: userId.toUpperCase(),
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setMessage("OTP sent successfully! Please check your phone.");
      setStatusType("success");
    } catch (err) {
      setMessage(err.message);
      setStatusType("error");
    }
  };

  // ✅ Step 2: Verify OTP + Password + Handle Redirects
  const handleVerifyOTPAndPassword = async (e) => {
    e.preventDefault();
    if (!validateIdForRole(userId)) {
      setStatusType("error");
      return;
    }

    setMessage("Verifying credentials...");
    setStatusType("info");

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/verify-otp-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId.toUpperCase(),
            otp,
            password,
            role: selectedRole,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP or Password");

      // Store auth info
      localStorage.setItem("grievance_id", data.id.toUpperCase());
      localStorage.setItem("grievance_role", data.role.toLowerCase());
      localStorage.setItem("grievance_token", data.token);

      // Default: Reset staff admin flag
      localStorage.removeItem("grievance_staff_isAdmin");

      setMessage("Login successful! Checking permissions...");
      setStatusType("success");

      const role = data.role.toLowerCase();
      const idUpper = data.id.toUpperCase();

      setTimeout(async () => {
        // --- STUDENT ---
        if (role === "student") {
          navigate("/student/dashboard");
        } 
        
        // --- STAFF (Check if Admin Staff) ---
        else if (role === "staff") {
          try {
            // Check with backend if this staff member has admin rights
            const checkRes = await fetch(`http://localhost:5000/api/admin-staff/check/${idUpper}`);
            
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              
              if (checkData.isAdmin) {
                 // ✅ STAFF IS ADMIN -> GO TO ADMIN DASHBOARD
                 localStorage.setItem("grievance_staff_isAdmin", "true");
                 navigate("/staff/admin");
              } else {
                 // ❌ NORMAL STAFF -> GO TO GENERAL DASHBOARD
                 localStorage.setItem("grievance_staff_isAdmin", "false");
                 navigate("/staff/general");
              }
            } else {
              // API failed, assume normal staff
              localStorage.setItem("grievance_staff_isAdmin", "false");
              navigate("/staff/general");
            }
          } catch (err) {
            console.error("Error checking admin status:", err);
            // On error, fallback to normal staff dashboard
            localStorage.setItem("grievance_staff_isAdmin", "false");
            navigate("/staff/general");
          }
        } 
        
        // --- ADMIN (Main Admins) ---
        else if (role === "admin") {
          const adminRoutes = {
            ADM01: "/admin/dashboard",
            ADM_ACCOUNT: "/admin/account",
            ADM_WELFARE: "/admin/studentwelfare",
            ADM_ADMISSION: "/admin/admission",
            ADM_EXAM: "/admin/examination",
          };
          navigate(adminRoutes[idUpper] || "/admin/dashboard");
        }
      }, 1000);

    } catch (err) {
      setMessage(err.message);
      setStatusType("error");
    }
  };

  return (
    <div className="login-container">
      {/* LEFT SIDE: Branding & Role Selection */}
      <div className="login-brand-section">
        <div className="brand-content">
          <h1>Grievance Portal</h1>
          <p>
            Secure, transparent, and efficient resolution. Please select your
            role to begin.
          </p>

          <div className="role-selector">
            <div
              className={`role-card ${
                selectedRole === "student" ? "active" : ""
              }`}
              onClick={() => handleRoleSelect("student")}
            >
              <StudentIcon />
              <h3>Student</h3>
            </div>
            <div
              className={`role-card ${
                selectedRole === "staff" ? "active" : ""
              }`}
              onClick={() => handleRoleSelect("staff")}
            >
              <StaffIcon />
              <h3>Staff</h3>
            </div>
            <div
              className={`role-card ${
                selectedRole === "admin" ? "active" : ""
              }`}
              onClick={() => handleRoleSelect("admin")}
            >
              <AdminIcon />
              <h3>Admin</h3>
            </div>
          </div>

          <div className="brand-footer">
            © 2025 CT University Administration
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
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
                <h2>
                  Welcome Back,{" "}
                  {selectedRole.charAt(0).toUpperCase() +
                    selectedRole.slice(1)}
                </h2>
                <p>
                  Please login to access your {selectedRole} dashboard
                </p>
              </div>

              {message && (
                <div className={`alert-box ${statusType}`}>{message}</div>
              )}

              {!otpSent ? (
                <form
                  onSubmit={handleSendOTP}
                  className="animated-form"
                >
                  <div className="input-group">
                    <label>
                      {selectedRole.charAt(0).toUpperCase() +
                        selectedRole.slice(1)}{" "}
                      ID
                    </label>
                    <div className="input-wrapper">
                      <span className="icon">
                        <UserIcon />
                      </span>
                      <input
                        type="text"
                        placeholder={
                          selectedRole === "student"
                            ? "e.g. STU001"
                            : selectedRole === "staff"
                            ? "e.g. STF001"
                            : "e.g. ADM_EXAM"
                        }
                        value={userId}
                        onChange={(e) =>
                          setUserId(e.target.value.toUpperCase())
                        }
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <span className="icon">
                        <LockIcon />
                      </span>
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
                      <span className="icon">
                        <PhoneIcon />
                      </span>
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

                  <button className="btn-primary" type="submit">
                    Send Verification OTP
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleVerifyOTPAndPassword}
                  className="animated-form"
                >
                  <div className="otp-header">
                    <p>
                      Enter the OTP sent to your phone ending in{" "}
                      <strong>******{phone.slice(-4)}</strong>
                    </p>
                  </div>

                  <div className="input-group">
                    <label>One Time Password</label>
                    <div className="input-wrapper">
                      <span className="icon">
                        <KeyIcon />
                      </span>
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

                  <button className="btn-primary" type="submit">
                    Verify & Login
                  </button>

                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setOtpSent(false);
                      setMessage("");
                    }}
                  >
                    Back to details
                  </button>
                </form>
              )}

              <div className="form-footer">
                <p>
                  Don’t have an account?{" "}
                  <a href="/register">Register Issue</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;