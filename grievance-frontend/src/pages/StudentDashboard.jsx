import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";
import ChatPopup from "../components/ChatPopup"; // ✅ Import ChatPopup

// ✅ DATA: Map Program -> School
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

// ✅ Helper: Find School Name
const getSchoolFromProgram = (programName) => {
  if (!programName) return "";
  const cleanDbProgram = programName.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const [school, programs] of Object.entries(academicPrograms)) {
    const found = programs.find(p =>
      p.trim().toLowerCase().replace(/\s+/g, ' ') === cleanDbProgram
    );
    if (found) return school;
  }
  return "";
};

// ✅ Helper: Format Date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
};

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("grievance_role");
  const userId = localStorage.getItem("grievance_id");

  // ✅ STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState("submit"); // 'submit' or 'history'
  const [history, setHistory] = useState([]); // Stores past grievances
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 }); // Stores counts
  
  const [formData, setFormData] = useState({
    name: "", regid: userId || "", email: "", phone: "", school: "", message: "",
  });
  const [attachment, setAttachment] = useState(null);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatGrievanceId, setChatGrievanceId] = useState(null);

  // 1. Route Protection
  useEffect(() => {
    if (!role || role !== "student") navigate("/");
  }, [role, navigate]);

  // 2. Fetch User Profile (Auto-Fill)
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
        console.error("Error fetching user details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUserDetails();
  }, [userId]);

  // 3. ✅ NEW: Fetch Grievance History & Calculate Stats
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/grievances/user/${userId}`);
        const data = await res.json();
        
        if (res.ok) {
          setHistory(data);
          // Calculate Stats
          const pending = data.filter(g => g.status !== "Resolved" && g.status !== "Rejected").length;
          const resolved = data.filter(g => g.status === "Resolved").length;
          setStats({ total: data.length, pending, resolved });
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    if (userId) fetchHistory();
  }, [userId, msg]); // Re-fetch when 'msg' changes (after a new submission)

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
    data.append("school", formData.school);
    data.append("category", "Student Welfare"); // Default category for main dash
    data.append("message", formData.message);
    if (attachment) data.append("attachment", attachment);

    try {
      const res = await fetch("http://localhost:5000/api/grievances", {
        method: "POST",
        body: data,
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);

      setMsg("✅ Submitted successfully!");
      setStatusType("success");
      setFormData(prev => ({ ...prev, message: "" }));
      setAttachment(null);
      document.getElementById("fileInput").value = "";
      
      // Switch to history tab to show the new item
      setTimeout(() => setActiveTab("history"), 1500);
      
    } catch (err) {
      setMsg(`❌ ${err.message}`);
      setStatusType("error");
    }
  };

  const openChat = (gId) => {
    setChatGrievanceId(gId);
    setIsChatOpen(true);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <p>Welcome back, <strong>{formData.name || userId}</strong></p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      {/* ✅ NAVBAR */}
      <nav className="navbar">
        <ul>
          <li className="active"><Link to="/student/dashboard">Dashboard</Link></li>
          <li><Link to="/student/welfare">Student Welfare</Link></li>
          <li><Link to="/student/admission">Admission</Link></li>
          <li><Link to="/student/accounts">Accounts</Link></li>
          <li><Link to="/student/examination">Examination</Link></li>
          <li><Link to="/student/department">Department</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        
        {/* ✅ VISUAL STATS CARDS */}
        <div className="stats-row">
          <div className="stat-card total">
            <h3>Total Grievances</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <p>{stats.pending}</p>
          </div>
          <div className="stat-card resolved">
            <h3>Resolved</h3>
            <p>{stats.resolved}</p>
          </div>
        </div>

        {/* ✅ TOGGLE TABS */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`} 
            onClick={() => setActiveTab('submit')}
          >
            Submit New Grievance
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => setActiveTab('history')}
          >
            Track My History
          </button>
        </div>

        <div className="card">
          {/* 🟢 VIEW 1: SUBMIT FORM */}
          {activeTab === 'submit' && (
            <>
              <h2>Submit General Grievance</h2>
              <p>For specific department issues, please use the navigation bar above.</p>
              
              {loading ? <p>Loading profile...</p> : (
                <form onSubmit={handleSubmit}>
                  {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

                  <div className="form-row">
                    <div className="input-group">
                      <label>Full Name</label>
                      <input type="text" value={formData.name} readOnly className="read-only-input" />
                    </div>
                    <div className="input-group">
                      <label>Reg ID</label>
                      <input type="text" value={formData.regid} readOnly className="read-only-input" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>Email</label>
                      <input type="email" value={formData.email} readOnly className="read-only-input" />
                    </div>
                    <div className="input-group">
                      <label>Phone</label>
                      <input type="text" value={formData.phone} readOnly className="read-only-input" />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>School</label>
                    <input type="text" value={formData.school} readOnly className="read-only-input" />
                  </div>

                  <div className="input-group">
                    <label>Message</label>
                    <textarea 
                      name="message" 
                      value={formData.message} 
                      onChange={handleChange} 
                      rows="5" 
                      placeholder="Describe your issue..." 
                      required 
                    ></textarea>
                  </div>

                  <div className="input-group">
                    <label>Attach Document (Optional)</label>
                    <input id="fileInput" type="file" onChange={handleFileChange} className="file-input" />
                  </div>

                  <button type="submit" className="submit-btn">Submit</button>
                </form>
              )}
            </>
          )}

          {/* 🔵 VIEW 2: HISTORY TABLE */}
          {activeTab === 'history' && (
            <>
              <h2>My Grievance History</h2>
              {history.length === 0 ? (
                <div className="empty-state">
                  <p>You haven't submitted any grievances yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="grievance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Admin Remark</th>
                        <th>Action</th> {/* ✅ Added Action Column */}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((g) => (
                        <tr key={g._id}>
                          <td>{formatDate(g.createdAt)}</td>
                          <td>{g.category}</td>
                          <td className="message-cell">{g.message.substring(0, 50)}...</td>
                          <td>
                            <span className={`status-badge status-${g.status.toLowerCase().replace(" ", "")}`}>
                              {g.status}
                            </span>
                          </td>
                          <td>{g.resolutionRemarks || "-"}</td>
                          <td>
                            {/* ✅ CHAT BUTTON */}
                            <button 
                              className="action-btn" 
                              style={{backgroundColor: "#3b82f6", color: "white"}}
                              onClick={() => openChat(g._id)}
                            >
                              Chat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ✅ Chat Popup Component */}
      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        grievanceId={chatGrievanceId} 
        currentUserId={userId}
        currentUserRole="student"
      />
    </div>
  );
}

export default StudentDashboard;