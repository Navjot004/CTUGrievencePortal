import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

// Helper: format dates for tables
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

const schools = [
  "School of Engineering and Technology",
  "School of Management Studies",
  "School of Law",
  "School of Pharmaceutical Sciences",
  "School of Hotel Management",
  "School of Design and innovation",
  "School of Allied Health Sciences",
  "School of Social Sciences and Liberal Arts"
];

function StaffDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role");
  const userId = localStorage.getItem("grievance_id"); // e.g. STF001

  // UI State
  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "mine"

  // Staff Info
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffDept, setStaffDept] = useState("");

  // Form Data for submitting grievance as staff
  const [formData, setFormData] = useState({
    name: "",
    staffId: userId || "",
    email: "",
    department: "", // Stores selected School
    message: "",
  });

  const [attachment, setAttachment] = useState(null); // ✅ Added Attachment State
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [errors, setErrors] = useState({});

  // Data for tables
  const [myGrievances, setMyGrievances] = useState([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);

  // ✅ State for "See More" Details Popup
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  // Route protection
  useEffect(() => {
    if (!role || role !== "staff") navigate("/");
  }, [role, navigate]);

  // Fetch staff profile
  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!userId) {
        setLoadingProfile(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/auth/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setStaffName(data.fullName || userId);
          setStaffEmail(data.email || "");
          setStaffDept(data.department || "");
          setFormData((prev) => ({
            ...prev,
            name: data.fullName || "",
            email: data.email || "",
            department: data.department || "",
          }));
        } else {
          setStaffName(userId);
        }
      } catch (err) {
        console.error("Error fetching staff profile:", err);
        setStaffName(userId);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchStaffDetails();
  }, [userId]);

  // Fetch grievances submitted by this staff
  const fetchMyGrievances = async () => {
    if (!userId) return;
    setLoadingMine(true);
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/user/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch my grievances");
      setMyGrievances(data);
    } catch (err) {
      console.error("Error fetching my grievances:", err);
      setMsg("Failed to load your submitted grievances");
      setStatusType("error");
    } finally {
      setLoadingMine(false);
    }
  };

  // Initial load of my grievances
  useEffect(() => {
    fetchMyGrievances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Validation for form fields (submit grievance)
  const validateField = (name, value) => {
    let error = "";
    if (!value) {
      error = "This field is required";
    } else if (name === "email" && !/\S+@\S+\.\S+/.test(value)) {
      error = "Email address is invalid";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) {
        newErrors[key] = "This field is required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Submit grievance as staff
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMsg("Please fill out all required fields.");
      setStatusType("error");
      return;
    }

    setMsg("Submitting your grievance...");
    setStatusType("info");

    // 1️⃣ Upload File to MongoDB (GridFS) First
    let attachmentUrl = "";
    if (attachment) {
      const fileData = new FormData();
      fileData.append("file", attachment);
      try {
        const uploadRes = await fetch("http://localhost:5000/api/upload", { method: "POST", body: fileData });
        if (!uploadRes.ok) throw new Error("File upload failed");
        const uploadJson = await uploadRes.json();
        attachmentUrl = uploadJson.filename;
      } catch (err) {
        setMsg(`❌ Upload Error: ${err.message}`); setStatusType("error"); return;
      }
    }

    try {
      const res = await fetch("http://localhost:5000/api/grievances/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: formData.name,
          email: formData.email,
          phone: "", 
          regid: formData.staffId,
          school: formData.department, // Selected School
          category: formData.department, // Routes to School Admin
          message: formData.message,
          studentProgram: "Staff Member", // Required by backend
          attachment: attachmentUrl || "" // ✅ Send filename
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      setMsg("Grievance submitted successfully!");
      setStatusType("success");

      setFormData((prev) => ({
        ...prev,
        message: "",
      }));
      setErrors({});
      setAttachment(null);
      if(document.getElementById("staffFileInput")) document.getElementById("staffFileInput").value = "";

      fetchMyGrievances();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  const handleUpdateAssignedStatus = async (id, newStatus) => {
    setMsg("Updating grievance status...");
    setStatusType("info");

    const body = { status: newStatus };
    if (newStatus === "Resolved") {
      body.resolvedBy = userId;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");

      setMsg("Grievance updated successfully!");
      setStatusType("success");

      fetchMyGrievances();
    } catch (err) {
      console.error("Error updating assigned grievance:", err);
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  // ✅ Navbar Button Styles (For proper tabs)
  const navButtonStyle = (isActive) => ({
    background: "none",
    border: "none",
    padding: "10px 15px", // Spacing badha di
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: isActive ? "600" : "500",
    color: isActive ? "#2563eb" : "#64748b",
    borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
    transition: "all 0.2s ease"
  });

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Staff Dashboard</h1>
          <p>
            {loadingProfile
              ? "Loading your profile..."
              : `Welcome, ${staffName || userId}`}
          </p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* ✅ FIXED NAVBAR TABS */}
      <nav className="navbar" style={{ padding: '0 20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li>
            <button
              onClick={() => setActiveTab("submit")}
              style={navButtonStyle(activeTab === "submit")}
            >
              Submit Grievance
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("mine")}
              style={navButtonStyle(activeTab === "mine")}
            >
              My Submissions
            </button>
          </li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {/* TAB 1: Submit Grievance */}
          {activeTab === "submit" && (
            <>
              <h2>Submit Staff Grievance</h2>
              <p>Select the relevant School/Department and describe your issue. It will be routed to the Head of Department.</p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={formData.name} readOnly className="read-only-input" />
                  </div>

                  <div className="input-group">
                    <label>Staff ID</label>
                    <input type="text" name="staffId" value={formData.staffId} readOnly className="read-only-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@college.edu" />
                  </div>
                </div>

                {/* ✅ SCHOOL SELECTION DROPDOWN */}
                <div className="input-group">
                  <label>Select School / Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} required>
                    <option value="">-- Select School --</option>
                    {schools.map((school) => <option key={school} value={school}>{school}</option>)}
                  </select>
                  {errors.department && <p className="error-text">{errors.department}</p>}
                </div>

                <div className="input-group">
                  <label>Message / Query</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Describe your issue..." rows="5"></textarea>
                  {errors.message && <p className="error-text">{errors.message}</p>}
                </div>

                <div className="input-group">
                  <label>Attach Document (Optional)</label>
                  <input 
                    id="staffFileInput"
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="file-input"
                  />
                </div>

                <button type="submit" className="submit-btn">Submit Grievance</button>
              </form>
            </>
          )}

          {/* TAB 2: My Submissions */}
          {activeTab === "mine" && (
            <>
              <h2>My Submitted Grievances</h2>
              <p>These are grievances you have submitted as staff.</p>

              {loadingMine ? (
                <p>Loading your grievances...</p>
              ) : myGrievances.length === 0 ? (
                <div className="empty-state"><p>You have not submitted any grievances yet.</p></div>
              ) : (
                <div className="table-container">
                  <table className="grievance-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myGrievances.map((g) => (
                        <tr key={g._id}>
                          <td>{g.category}</td>
                          
                          {/* --- FIXED MESSAGE CELL (Max Width 150px + See More) --- */}
                          <td className="message-cell" style={{ maxWidth: '150px' }}>
                            {g.attachment && <span style={{ marginRight: "5px", fontSize: "1.1rem" }} title="Has Attachment">📎</span>}
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                              <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>
                                {g.message.substring(0, 20)}{g.message.length > 20 ? "..." : ""}
                              </span>
                              <button 
                                onClick={() => setSelectedGrievance(g)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  textDecoration: 'underline',
                                  padding: 0,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                See more
                              </button>
                            </div>
                          </td>
                          {/* ---------------------------------------------------- */}

                          <td>
                            <span className={`status-badge status-${g.status.toLowerCase()}`}>
                              {g.status}
                            </span>
                          </td>
                          <td>{g.assignedTo || "Not Assigned"}</td>
                          <td>{formatDate(g.createdAt)}</td>
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

      {/* --- DETAILS POPUP MODAL (Fixed for Long Text) --- */}
      {selectedGrievance && (
        <div 
          onClick={() => setSelectedGrievance(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '85vh'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Grievance Details</h3>
              <button onClick={() => setSelectedGrievance(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            
            <div style={{ overflowY: 'auto', paddingRight: '5px' }}>
              <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Category:</strong> {selectedGrievance.category}</p>
              
              {selectedGrievance.name && (
                <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Submitted By:</strong> {selectedGrievance.name}</p>
              )}
              
              <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
              <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Status:</strong> <span className={`status-badge status-${selectedGrievance.status.toLowerCase()}`}>{selectedGrievance.status}</span></p>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: '#334155' }}>Full Message:</strong>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#1e293b', wordBreak: 'break-word' }}>
                  {selectedGrievance.message}
                </p>
              </div>

              {/* ✅ ATTACHMENT BUTTON */}
              {selectedGrievance.attachment && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Attachment: </strong>
                  <a 
                    href={`http://localhost:5000/api/file/${selectedGrievance.attachment}`} 
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    View Document 📎
                  </a>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <button 
                onClick={() => setSelectedGrievance(null)}
                style={{
                  padding: '10px 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#cbd5e1'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e2e8f0'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------------- */}

      <button className="logout-floating" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default StaffDashboard;