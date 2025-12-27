// import React, { useState } from "react";
// import { Link } from "react-router-dom"; 
// import "../styles/LoginPage.css"; 

// // ----- ICONS (Same as before) -----
// const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
// const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
// const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
// const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
// const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
// const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 19.5z"></path><path d="M4 7v5h16V7H4z"></path><path d="M18 17H6.5C4 17 4 14.5 4 14.5V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7.5c0 0 .1 2.5-2.5 2.5z"></path></svg>;

// // ----- DATA: ACADEMIC PROGRAMS -----
// const academicPrograms = {
//   "Engineering & Technology": [
//     "B.Tech - Computer Science (CSE)",
//     "B.Tech - AI & Data Science (IBM)",
//     "B.Tech - Cyber Security (IBM)",
//     "B.Tech - Civil Engineering",
//     "B.Tech - Mechanical Engineering",
//     "B.Tech - Electronics & Comm (ECE)",
//     "B.Tech - Robotics & Automation",
//     "B.Tech - Electric Vehicle Tech",
//     "M.Tech - CSE",
//     "M.Tech - Civil / Mechanical / Production"
//   ],
//   "Computer Applications & IT": [
//     "BCA - General",
//     "BCA - Data Science & AI",
//     "MCA - General",
//     "MCA - Cyber Security",
//     "B.Sc - Computer Science",
//     "B.Sc - Information Technology"
//   ],
//   "Management & Commerce": [
//     "BBA - General",
//     "BBA - Digital Marketing",
//     "BBA - Financial Services",
//     "BBA - Business Analytics (IBM)",
//     "MBA - International Business",
//     "MBA - Finance / Marketing / HR",
//     "MBA - Business Analytics (IBM)",
//     "MBA - Healthcare Management",
//     "B.Com - General",
//     "B.Com - Honors"
//   ],
//   "Pharmaceutical Sciences": [
//     "B.Pharm (Bachelor of Pharmacy)",
//     "D.Pharm (Diploma in Pharmacy)",
//     "M.Pharm - Pharmaceutics",
//     "M.Pharm - Pharmacology",
//     "Pharm.D (Doctor of Pharmacy)"
//   ],
//   "Allied Health Sciences": [
//     "BPT (Bachelor of Physiotherapy)",
//     "B.Sc - Medical Lab Tech (MLT)",
//     "B.Sc - Radiology & Imaging Tech",
//     "B.Sc - Operation Theatre Tech (OTT)",
//     "B.Sc - Anesthesia Technology",
//     "B.Optom (Bachelor of Optometry)"
//   ],
//   "Law": [
//     "BA LL.B (5 Years)",
//     "B.Com LL.B (5 Years)",
//     "BBA LL.B (5 Years)",
//     "LL.B (3 Years)",
//     "LL.M (Master of Laws)"
//   ],
//   "Design, Architecture & Multimedia": [
//     "B.Des - Interior Design",
//     "B.Des - Fashion Design",
//     "B.Sc - Fashion Design",
//     "B.Sc - Multimedia & Animation",
//     "B.Sc - Graphic Design",
//     "B.Arch (Bachelor of Architecture)",
//     "M.Des / M.Sc - Design"
//   ],
//   "Hotel Management & Tourism": [
//     "BHMCT (Hotel Mgmt & Catering)",
//     "B.Sc - Airlines & Tourism (ATM)",
//     "Diploma - Food Production / Hotel Mgmt"
//   ],
//   "Agriculture": [
//     "B.Sc (Hons) Agriculture"
//   ],
//   "Humanities & Social Sciences": [
//     "BA - General",
//     "BA - Journalism & Mass Comm",
//     "BA - Physical Education",
//     "MA - English / Punjabi / Economics",
//     "M.Sc - Economics / Psychology"
//   ]
// };

// function RegisterPage() {
//   const [formData, setFormData] = useState({
//     id: "",
//     role: "",
//     studentType: "current", // ✅ New State for Student Type (Default: current)
//     fullName: "",
//     email: "",
//     phone: "",
//     password: "",
//     program: "",
//   });

//   const [msg, setMsg] = useState("");
//   const [statusType, setStatusType] = useState("");
//   const [errors, setErrors] = useState({}); 

//   // Helper to validate ID format based on role
//   const validateIdFormat = (role, id) => {
//     if (!id) return "";
//     const upperId = id.toUpperCase();
//     if (role === "student" && !upperId.startsWith("STU")) return "Student ID must start with STU";
//     if (role === "staff" && !upperId.startsWith("STF")) return "Staff ID must start with STF";
//     if (role === "admin" && !upperId.startsWith("ADM")) return "Admin ID must start with ADM";
//     return "";
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
    
//     const processedValue = name === "id" ? value.toUpperCase() : value;

//     setFormData({ ...formData, [name]: processedValue });

//     // Instant Validation Logic
//     let error = "";
//     if (name === "id") {
//       error = validateIdFormat(formData.role, processedValue);
//     } else if (name === "role") {
//       const idError = validateIdFormat(processedValue, formData.id);
//       setErrors(prev => ({ ...prev, id: idError }));
//     }

//     if (error) {
//       setErrors(prev => ({ ...prev, [name]: error }));
//     } else {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors[name];
//         return newErrors;
//       });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     const idError = validateIdFormat(formData.role, formData.id);
//     if (idError) {
//       setErrors(prev => ({ ...prev, id: idError }));
//       setMsg("Please fix the errors before submitting.");
//       setStatusType("error");
//       return;
//     }

//     setMsg("Submitting...");
//     setStatusType("info");

//     const submissionData = { ...formData };
    
//     // Clean up data based on role
//     if (submissionData.role !== 'student') {
//       submissionData.program = ''; 
//       delete submissionData.studentType; // Remove studentType if not student
//     }

//     try {
//       const res = await fetch("http://localhost:5000/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(submissionData),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.message);
//       setMsg("Registration successful! You can now login.");
//       setStatusType("success");
//       setFormData({
//         id: "", role: "", studentType: "current", fullName: "", email: "", phone: "", password: "", program: "",
//       }); 
//     } catch (err) {
//       setMsg(err.message || "An error occurred during registration.");
//       setStatusType("error");
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="login-brand-section">
//         <div className="brand-content">
//           <h1>Create an Account</h1>
//           <p>Join the portal to submit grievances and track their resolution.</p>
//           <div className="brand-footer">© 2025 University Administration</div>
//         </div>
//       </div>

//       <div className="login-form-section">
//         <div className="form-wrapper">
//           <div className="form-header">
//             <h2>Register</h2>
//             <p>Fill in your details to get started.</p>
//           </div>

//           {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

//           <form onSubmit={handleSubmit}>
//             <div className="input-group">
//               <label>Role</label>
//               <div className="input-wrapper">
//                 <span className="icon"><UsersIcon /></span>
//                 <select name="role" value={formData.role} onChange={handleChange} required>
//                   <option value="">Select Role</option>
//                   <option value="student">Student</option>
//                   <option value="staff">Staff</option>
//                   <option value="admin">Admin</option>
//                 </select>
//               </div>
//             </div>

//             {/* ✅ NEW: Student Type Radio Buttons (Appears only if Student) */}
//             {formData.role === 'student' && (
//               <div className="input-group">
//                 <label>Student Status</label>
//                 <div className="radio-group-container">
//                   <label className={`radio-option ${formData.studentType === 'current' ? 'active' : ''}`}>
//                     <input 
//                       type="radio" 
//                       name="studentType" 
//                       value="current" 
//                       checked={formData.studentType === 'current'} 
//                       onChange={handleChange}
//                     />
//                     Current Student
//                   </label>
//                   <label className={`radio-option ${formData.studentType === 'alumni' ? 'active' : ''}`}>
//                     <input 
//                       type="radio" 
//                       name="studentType" 
//                       value="alumni" 
//                       checked={formData.studentType === 'alumni'} 
//                       onChange={handleChange}
//                     />
//                     Alumni
//                   </label>
//                 </div>
//               </div>
//             )}
            
//             <div className="input-group">
//               <label>User ID</label>
//               <div className="input-wrapper">
//                 <span className="icon"><UserIcon /></span>
//                 <input
//                   name="id"
//                   placeholder="e.g. STU001 or STF001"
//                   value={formData.id}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//               {errors.id && <p className="error-text">{errors.id}</p>}
//             </div>

//             <div className="input-group">
//               <label>Full Name</label>
//               <div className="input-wrapper">
//                 <span className="icon"><UserIcon /></span>
//                 <input
//                   name="fullName"
//                   placeholder="Enter your full name"
//                   value={formData.fullName}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             <div className="input-group">
//               <label>Email</label>
//               <div className="input-wrapper">
//                 <span className="icon"><MailIcon /></span>
//                 <input
//                   name="email"
//                   type="email"
//                   placeholder="name@university.com"
//                   value={formData.email}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             <div className="input-group">
//               <label>Phone</label>
//               <div className="input-wrapper">
//                 <span className="icon"><PhoneIcon /></span>
//                 <input
//                   name="phone"
//                   type="tel"
//                   placeholder="9876543210"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   pattern="[0-9]{10}"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="input-group">
//               <label>Password</label>
//               <div className="input-wrapper">
//                 <span className="icon"><LockIcon /></span>
//                 <input
//                   name="password"
//                   type="password"
//                   placeholder="Create a strong password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   required
//                 />
//               </div>
//             </div>

//             {formData.role === 'student' && (
//               <div className="input-group">
//                 <label>Program & Domain</label>
//                 <div className="input-wrapper">
//                   <span className="icon"><BookIcon /></span>
//                   <select 
//                     name="program" 
//                     value={formData.program} 
//                     onChange={handleChange} 
//                     required
//                   >
//                     <option value="">Select Your Program</option>
//                     {Object.entries(academicPrograms).map(([dept, courses]) => (
//                       <optgroup key={dept} label={dept}>
//                         {courses.map((course) => (
//                           <option key={course} value={course}>
//                             {course}
//                           </option>
//                         ))}
//                       </optgroup>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             )}

//             <button className="btn-primary" type="submit">
//               Register Account
//             </button>
//           </form>

//           <div className="form-footer">
//             <p>
//               Already have an account? <Link to="/">Login here</Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default RegisterPage;
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/LoginPage.css"; 

// ----- ICONS -----
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 19.5z"></path><path d="M4 7v5h16V7H4z"></path><path d="M18 17H6.5C4 17 4 14.5 4 14.5V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7.5c0 0 .1 2.5-2.5 2.5z"></path></svg>;

const academicPrograms = {
  "School of Engineering and Technology": ["B.Tech - Computer Science (CSE)", "B.Tech - AI & Data Science (IBM)", "B.Tech - Cyber Security (IBM)", "B.Tech - Civil Engineering", "B.Tech - Mechanical Engineering", "B.Tech - Electronics & Comm (ECE)", "B.Tech - Robotics & Automation", "M.Tech - CSE / Civil / Mech", "BCA - General / Data Science", "MCA - General / Cyber Security", "B.Sc - Computer Science / IT"],
  "School of Management Studies": ["BBA - General", "BBA - Digital Marketing", "BBA - Financial Services", "BBA - Business Analytics (IBM)", "MBA - International Business", "MBA - Finance / Marketing / HR", "MBA - Business Analytics (IBM)", "B.Com - General / Honors"],
  "School of Hotel Management, Airlines and Tourism": ["BHMCT (Hotel Mgmt & Catering)", "B.Sc - Airlines & Tourism (ATM)", "Diploma - Food Production", "Diploma - Hotel Management"],
  "School of Law": ["BA LL.B (5 Years)", "B.Com LL.B (5 Years)", "BBA LL.B (5 Years)", "LL.B (3 Years)", "LL.M (Master of Laws)"],
  "School of Pharmaceutical Sciences": ["B.Pharm (Bachelor of Pharmacy)", "D.Pharm (Diploma in Pharmacy)", "M.Pharm - Pharmaceutics / Pharmacology", "Pharm.D (Doctor of Pharmacy)"],
  "School of Design and Innovation": ["B.Des - Interior Design", "B.Des - Fashion Design", "B.Sc - Fashion Design", "B.Sc - Multimedia & Animation", "B.Sc - Graphic Design", "B.Arch (Bachelor of Architecture)", "M.Des / M.Sc - Design"],
  "School of Allied Health Sciences": ["BPT (Bachelor of Physiotherapy)", "B.Sc - Medical Lab Tech (MLT)", "B.Sc - Radiology & Imaging Tech", "B.Sc - Operation Theatre Tech (OTT)", "B.Sc - Anesthesia Technology", "B.Optom (Bachelor of Optometry)"],
  "School of Social Sciences and Liberal Arts": ["BA - General", "BA - Journalism & Mass Comm", "BA - Physical Education", "MA - English / Punjabi / Economics", "M.Sc - Economics / Psychology"]
};

function RegisterPage() {
  const [formData, setFormData] = useState({ id: "", role: "", studentType: "current", fullName: "", email: "", phone: "", password: "", program: "", });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Registration Form, 2: OTP Entry
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [errors, setErrors] = useState({});

  // Inline CSS for new components
  const extraStyles = {
    alertBox: { padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: '500' },
    success: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
    info: { backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' },
    otpInput: { letterSpacing: '8px', fontSize: '24px', textAlign: 'center', fontWeight: 'bold' },
    backBtn: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', fontSize: '14px' }
  };

  const validateIdFormat = (role, id) => {
    if (!id) return "";
    const upperId = id.toUpperCase();
    if (role === "student" && !upperId.startsWith("STU")) return "Student ID must start with STU";
    if (role === "staff" && !upperId.startsWith("STF")) return "Staff ID must start with STF";
    if (role === "admin" && !upperId.startsWith("ADM")) return "Admin ID must start with ADM";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "id" ? value.toUpperCase() : value;
    setFormData({ ...formData, [name]: processedValue });
    
    if (name === "id") {
      const error = validateIdFormat(formData.role, processedValue);
      setErrors(prev => ({ ...prev, id: error }));
    }
  };

  // STEP 1: Request OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const idError = validateIdFormat(formData.role, formData.id);
    if (idError) {
      setErrors(prev => ({ ...prev, id: idError }));
      return;
    }

    setMsg("Sending OTP to your email...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep(2); // Move to OTP input
      setMsg("Verification code sent to your email!");
      setStatusType("success");
    } catch (err) {
      setMsg(err.message || "Failed to send OTP.");
      setStatusType("error");
    }
  };

  // STEP 2: Verify OTP and Create Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMsg("Finalizing registration...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the OTP along with the whole formData to save the user in DB
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
            <p>{step === 1 ? "Fill in your details to get started." : `Sent to ${formData.email}`}</p>
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
                  <label>User ID</label>
                  <div className="input-wrapper">
                    <span className="icon"><UserIcon /></span>
                    <input name="id" placeholder="e.g. STU001" value={formData.id} onChange={handleChange} required />
                  </div>
                  {errors.id && <p className="error-text">{errors.id}</p>}
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
            /* OTP VERIFICATION FORM */
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