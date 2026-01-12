import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/LoginPage.css";

// Icons
// Icons
import { UserIcon, LockIcon, PhoneIcon, MailIcon, UsersIcon, BookIcon, EyeIcon, EyeOffIcon } from "../components/Icons";

const academicPrograms = {
  "School of Engineering and Technology": ["B.Tech - CSE", "B.Tech - AI", "B.Tech - Civil", "B.Tech - Mech", "BCA", "MCA"],
  "School of Management Studies": ["BBA", "MBA", "B.Com"],
  "School of Law": ["BA LL.B", "LL.B", "LL.M"],
  "School of Pharmaceutical Sciences": ["B.Pharm", "D.Pharm"],
  "School of Design": ["B.Des", "B.Sc Animation"],
  "School of Health Sciences": ["BPT", "B.Sc MLT"]
};

function RegisterPage() {
  const [formData, setFormData] = useState({ id: "", role: "", studentType: "current", fullName: "", email: "", phone: "", password: "", program: "", });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState(""); // ✅ Confirm Password State
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");

  const extraStyles = {
    alertBox: { padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: '500' },
    success: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
    info: { backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' },
    otpInput: { letterSpacing: '8px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold' },
    backBtn: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', fontSize: '14px' }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Keep uppercase but allow numbers freely
    const processedValue = name === "id" ? value.toUpperCase() : value;
    setFormData({ ...formData, [name]: processedValue });
  };

  // STEP 1: Request OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // ✅ Password Match Validation
    if (formData.password !== confirmPassword) {
      setMsg("Passwords do not match!");
      setStatusType("error");
      return;
    }

    setMsg("Validating with University Records...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep(2);
      setMsg("ID Verified! OTP sent to your email.");
      setStatusType("success");
    } catch (err) {
      setMsg(err.message || "Failed to send OTP.");
      setStatusType("error");
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMsg("Finalizing registration...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
          formData: formData
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMsg("Registration successful! Redirecting...");
      setStatusType("success");
      setTimeout(() => window.location.href = "/", 2000);
    } catch (err) {
      setMsg(err.message || "Invalid OTP.");
      setStatusType("error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-brand-section">
        <div className="brand-content">
          <h1>{step === 1 ? "Create an Account" : "Verify Your Identity"}</h1>
          <p>{step === 1 ? "Join the portal to submit grievances and track their resolution." : "Check your email for the 6-digit verification code."}</p>
          <div className="brand-footer">© 2025 University Administration</div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>{step === 1 ? "Register" : "Enter OTP"}</h2>
            <p>{step === 1 ? "Enter details exactly as per University Records." : `Sent to ${formData.email}`}</p>
          </div>

          {msg && <div style={{ ...extraStyles.alertBox, ...extraStyles[statusType] }}>{msg}</div>}

          {step === 1 ? (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit}>
              <div className="two-col-row">
                <div className="input-group">
                  <label>Role</label>
                  <div className="input-wrapper role-field">
                    <span className="icon"><UsersIcon /></span>
                    <select name="role" value={formData.role} onChange={handleChange} required>
                      <option value="">Select Role</option>
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label>University ID</label>
                  <div className="input-wrapper id-field">
                    <span className="icon"><UserIcon /></span>
                    {/* ✅ UPDATED PLACEHOLDER */}
                    <input name="id" placeholder="e.g. 72212871" value={formData.id} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {formData.role === 'student' && (
                <div className="input-group">
                  <label>Student Status</label>
                  {/* ✅ Styled Radio Group */}
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <label style={{
                      flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: '500', transition: 'all 0.2s',
                      border: formData.studentType === 'current' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: formData.studentType === 'current' ? '#eff6ff' : 'white',
                      color: formData.studentType === 'current' ? '#2563eb' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <input type="radio" name="studentType" value="current" checked={formData.studentType === 'current'} onChange={handleChange} style={{ accentColor: '#2563eb' }} />
                      Current Student
                    </label>
                    <label style={{
                      flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontWeight: '500', transition: 'all 0.2s',
                      border: formData.studentType === 'alumni' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: formData.studentType === 'alumni' ? '#eff6ff' : 'white',
                      color: formData.studentType === 'alumni' ? '#2563eb' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <input type="radio" name="studentType" value="alumni" checked={formData.studentType === 'alumni'} onChange={handleChange} style={{ accentColor: '#2563eb' }} />
                      Alumni
                    </label>
                  </div>
                </div>
              )}

              <div className="two-col-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <span className="icon"><UserIcon /></span>
                    <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Phone</label>
                  <div className="input-wrapper phone-field">
                    <span className="icon"><PhoneIcon /></span>
                    <input name="phone" type="tel" placeholder="9876543210" value={formData.phone} onChange={handleChange} pattern="[0-9]{10}" required />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper email-field">
                  <span className="icon"><MailIcon /></span>
                  <input
                    name="email"
                    type="email"
                    placeholder={"e.g. name@univ.com or personal@mail.com"}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {formData.role === 'student' && (
                  <div className="field-hint info"><em>NOTE:- You may use your university or personal email. We'll send a verification code (OTP) to this address.</em></div>
                )}
              </div>

              <div className="two-col-row">
                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper password">
                    <span className="icon"><LockIcon /></span>
                    <input name="password" type={showPassword ? "text" : "password"} placeholder="Create Password" value={formData.password} onChange={handleChange} required />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ✅ Confirm Password Field */}
              <div className="input-group" style={{ marginBottom: '15px' }}>
                <label>Confirm Password</label>
                <div className="input-wrapper password" >
                  <span className="icon"><LockIcon /></span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {formData.role === 'student' && (
                <div className="input-group">
                  <label>Program & Domain</label>
                  <div className="input-wrapper program-field">
                    <span className="icon"><BookIcon /></span>
                    <select name="program" value={formData.program} onChange={handleChange} required>
                      <option value="">Select Your Program</option>
                      {Object.entries(academicPrograms).map(([dept, courses]) => (
                        <optgroup key={dept} label={dept}>
                          {courses.map(course => <option key={course} value={course}>{course}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button className="btn-primary" type="submit">Verify Email with OTP</button>
            </form>
          ) : (
            /* OTP FORM */
            <form onSubmit={handleVerifyOtp}>
              <div className="input-group">
                <label>Verification Code</label>
                <div className="input-wrapper otp-field">
                  <span className="icon"><LockIcon /></span>
                  <input
                    style={extraStyles.otpInput}
                    placeholder="000000"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button className="btn-primary" type="submit">Complete Registration</button>
              <center>
                <button type="button" onClick={() => setStep(1)} style={extraStyles.backBtn}>Back to edit details</button>
              </center>
            </form>
          )}

          <div className="form-footer">
            <p>Already have an account? <Link to="/">Login here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;