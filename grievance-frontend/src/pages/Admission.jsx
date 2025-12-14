// src/pages/Admission.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";

// ✅ Program → School mapping
const academicPrograms = {
  "School of Engineering and Technology": [
    "B.Tech - Computer Science (CSE)", "B.Tech - AI & Data Science (IBM)", "B.Tech - Cyber Security (IBM)", 
    "B.Tech - Civil Engineering", "B.Tech - Mechanical Engineering", "B.Tech - Electronics & Comm (ECE)", 
    "B.Tech - Robotics & Automation", "M.Tech - CSE / Civil / Mech", "BCA - General / Data Science", 
    "MCA - General / Cyber Security", "B.Sc - Computer Science / IT"
  ],
  "School of Management Studies": [
    "BBA - General", "BBA - Digital Marketing", "BBA - Financial Services", "BBA - Business Analytics (IBM)", 
    "MBA - International Business", "MBA - Finance / Marketing / HR", "MBA - Business Analytics (IBM)", 
    "B.Com - General / Honors"
  ],
  "School of Hotel Management, Airlines and Tourism": [
    "BHMCT (Hotel Mgmt & Catering)", "B.Sc - Airlines & Tourism (ATM)", "Diploma - Food Production", "Diploma - Hotel Management"
  ],
  "School of Law": [
    "BA LL.B (5 Years)", "B.Com LL.B (5 Years)", "BBA LL.B (5 Years)", "LL.B (3 Years)", "LL.M (Master of Laws)"
  ],
  "School of Pharmaceutical Sciences": [
    "B.Pharm (Bachelor of Pharmacy)", "D.Pharm (Diploma in Pharmacy)", "M.Pharm - Pharmaceutics / Pharmacology", "Pharm.D (Doctor of Pharmacy)"
  ],
  "School of Design and Innovation": [
    "B.Des - Interior Design", "B.Des - Fashion Design", "B.Sc - Fashion Design", "B.Sc - Multimedia & Animation", 
    "B.Sc - Graphic Design", "B.Arch (Bachelor of Architecture)", "M.Des / M.Sc - Design"
  ],
  "School of Allied Health Sciences": [
    "BPT (Bachelor of Physiotherapy)", "B.Sc - Medical Lab Tech (MLT)", "B.Sc - Radiology & Imaging Tech", 
    "B.Sc - Operation Theatre Tech (OTT)", "B.Sc - Anesthesia Technology", "B.Optom (Bachelor of Optometry)"
  ],
  "School of Social Sciences and Liberal Arts": [
    "BA - General", "BA - Journalism & Mass Comm", "BA - Physical Education", 
    "MA - English / Punjabi / Economics", "M.Sc - Economics / Psychology"
  ]
};

const getSchoolFromProgram = (programName) => {
  if (!programName) return "";
  const cleanDbProgram = programName.trim().toLowerCase().replace(/\s+/g, " ");
  for (const [school, programs] of Object.entries(academicPrograms)) {
    const found = programs.find((p) =>
      p.trim().toLowerCase().replace(/\s+/g, " ") === cleanDbProgram
    );
    if (found) return school;
  }
  return "";
};

function Admission() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role");
  const userId = localStorage.getItem("grievance_id");

  const currentCategory = "admission";
  const categoryTitle = "Admission";

  const [formData, setFormData] = useState({
    name: "",
    regid: userId || "",
    email: "",
    phone: "",
    school: "",
    issueType: "",
    message: "",
  });

  const [attachment, setAttachment] = useState(null);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role || role !== "student") navigate("/");
  }, [role, navigate]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
          const autoSelectedSchool = getSchoolFromProgram(data.program);
          setFormData((prev) => ({
            ...prev,
            name: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            school: autoSelectedSchool || "",
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUserDetails();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Submitting...");
    setStatusType("info");

    const data = new FormData();
    data.append("userId", userId);
    data.append("name", formData.name);
    data.append("regid", formData.regid);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    // ✅ student's school
    data.append("school", formData.school);
    data.append("category", "Admission");
    data.append("message", `${formData.issueType} - ${formData.message}`);

    if (attachment) {
      data.append("attachment", attachment);
    }

    try {
      const res = await fetch("http://localhost:5000/api/grievances", {
        method: "POST",
        body: data,
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);

      setMsg("✅ Grievance submitted successfully!");
      setStatusType("success");
      setFormData((prev) => ({ ...prev, issueType: "", message: "" }));
      setAttachment(null);
      const fileInput = document.getElementById("fileInput");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setMsg(`❌ ${err.message}`);
      setStatusType("error");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <p>Welcome, {formData.name || userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="navbar">
        <ul>
          <li><Link to="/student/dashboard">Dashboard</Link></li>
          <li><Link to="/student/welfare">Student Welfare</Link></li>
          <li><Link to="/student/admission">Admission</Link></li>
          <li><Link to="/student/accounts">Accounts</Link></li>
          <li><Link to="/student/examination">Examination</Link></li>
          <li><Link to="/student/department">Department</Link></li> {/* Add This */}
        </ul>
      </nav>
      <main className="dashboard-body">
        <div className="card">
          <h2>Submit {categoryTitle} Grievance</h2>

          {loading ? (
            <p>Loading your details...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

              <div className="form-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className="read-only-input"
                  />
                </div>
                <div className="input-group">
                  <label>Registration ID</label>
                  <input
                    type="text"
                    name="regid"
                    value={formData.regid}
                    readOnly
                    className="read-only-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="read-only-input"
                  />
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    readOnly
                    className="read-only-input"
                  />
                </div>
              </div>

              {/* ✅ School / Department */}
              <div className="input-group">
                <label>School / Department</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  readOnly
                  className="read-only-input"
                />
              </div>

              <div className="input-group">
                <label>Select Issue</label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose an Issue --</option>
                  <option value="Document Verification Issue">
                    Document Verification Issue
                  </option>
                  <option value="Admission Form Correction">
                    Admission Form Correction
                  </option>
                  <option value="Scholarship Query">Scholarship Query</option>
                  <option value="Admission Withdrawal">
                    Admission Withdrawal
                  </option>
                </select>
              </div>

              <div className="input-group">
                <label>Message (Optional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Details..."
                ></textarea>
              </div>

              <div className="input-group">
                <label>Attach Document (Optional)</label>
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="file-input"
                />
              </div>

              <button type="submit" className="submit-btn">
                Submit Grievance
              </button>
            </form>
          )}
        </div>
      </main>
      <button className="logout-floating" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Admission;
