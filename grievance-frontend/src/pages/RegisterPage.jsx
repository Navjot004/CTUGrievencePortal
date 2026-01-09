import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/LoginPage.css"; 

// Icons
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 19.5z"></path><path d="M4 7v5h16V7H4z"></path><path d="M18 17H6.5C4 17 4 14.5 4 14.5V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7.5c0 0 .1 2.5-2.5 2.5z"></path></svg>;

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
      setMsg("✅ ID Verified! OTP sent to your email.");
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
                  <div className="input-wrapper">
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
                  <div className="input-wrapper">
                    <span className="icon"><UserIcon /></span>
                    {/* ✅ UPDATED PLACEHOLDER */}
                    <input name="id" placeholder="e.g. 72212871" value={formData.id} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {formData.role === 'student' && (
                <div className="input-group">
                  <label>Student Status</label>
                  <div className="radio-group-container">
                    <label className={`radio-option ${formData.studentType === 'current' ? 'active' : ''}`}>
                      <input type="radio" name="studentType" value="current" checked={formData.studentType === 'current'} onChange={handleChange} /> Current Student
                    </label>
                    <label className={`radio-option ${formData.studentType === 'alumni' ? 'active' : ''}`}>
                      <input type="radio" name="studentType" value="alumni" checked={formData.studentType === 'alumni'} onChange={handleChange} /> Alumni
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
                  <div className="input-wrapper">
                    <span className="icon"><PhoneIcon /></span>
                    <input name="phone" type="tel" placeholder="9876543210" value={formData.phone} onChange={handleChange} pattern="[0-9]{10}" required />
                  </div>
                </div>
              </div>

              <div className="two-col-row">
                <div className="input-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <span className="icon"><MailIcon /></span>
                    <input name="email" type="email" placeholder="name@univ.com" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <span className="icon"><LockIcon /></span>
                    <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {formData.role === 'student' && (
                <div className="input-group">
                  <label>Program & Domain</label>
                  <div className="input-wrapper">
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
                <div className="input-wrapper">
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