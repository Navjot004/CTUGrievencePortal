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

function StaffDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role");
  const userId = localStorage.getItem("grievance_id"); // e.g. STF001

  // UI State
  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "assigned" | "mine"
  const [selectedCategory, setSelectedCategory] = useState("general");

  // Staff Info
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffDept, setStaffDept] = useState("");

  // Form Data for submitting grievance as staff
  const [formData, setFormData] = useState({
    name: "",
    staffId: userId || "",
    email: "",
    department: "",
    message: "",
  });

  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [errors, setErrors] = useState({});

  // Data for tables
  const [assignedGrievances, setAssignedGrievances] = useState([]);
  const [myGrievances, setMyGrievances] = useState([]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAssigned, setLoadingAssigned] = useState(true);
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

  // Fetch grievances assigned to this staff
  const fetchAssignedGrievances = async () => {
    if (!userId) return;
    setLoadingAssigned(true);
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/assigned/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch assigned grievances");
      setAssignedGrievances(data);
    } catch (err) {
      console.error("Error fetching assigned grievances:", err);
      setMsg("Failed to load assigned grievances");
      setStatusType("error");
    } finally {
      setLoadingAssigned(false);
    }
  };

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

  // Initial load of assigned + my grievances
  useEffect(() => {
    fetchAssignedGrievances();
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

    let categoryLabel = "";
    if (selectedCategory === "general") categoryLabel = "General";
    if (selectedCategory === "administration") categoryLabel = "Administration";
    if (selectedCategory === "finance") categoryLabel = "Finance";
    if (selectedCategory === "facilities") categoryLabel = "Facilities";

    try {
      const res = await fetch("http://localhost:5000/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: formData.name,
          email: formData.email,
          phone: "", 
          regid: formData.staffId,
          school: formData.department || "Staff Department",
          category: categoryLabel || "General",
          message: formData.message,
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

      fetchAssignedGrievances();
      fetchMyGrievances();
    } catch (err) {
      console.error("Error updating assigned grievance:", err);
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  const prettyCategoryTitle = (key) => {
    if (key === "general") return "General";
    if (key === "administration") return "Administration";
    if (key === "finance") return "Finance";
    if (key === "facilities") return "Facilities";
    return key;
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
              onClick={() => setActiveTab("assigned")}
              style={navButtonStyle(activeTab === "assigned")}
            >
              Assigned to Me
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
              <p>Select a category and describe your issue. It will be routed to the appropriate department.</p>

              <div className="dashboard-tabs" style={{ marginTop: "1rem" }}>
                {["general", "administration", "finance", "facilities"].map((cat) => (
                   <button
                   key={cat}
                   className={`tab-btn ${selectedCategory === cat ? "active" : ""}`}
                   type="button"
                   onClick={() => setSelectedCategory(cat)}
                 >
                   {cat.charAt(0).toUpperCase() + cat.slice(1)}
                 </button>
                ))}
              </div>

              <p style={{ marginTop: "0.75rem", color: "#64748b" }}>
                Current Category: <strong>{prettyCategoryTitle(selectedCategory)}</strong>
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" />
                    {errors.name && <p className="error-text">{errors.name}</p>}
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
                    {errors.email && <p className="error-text">{errors.email}</p>}
                  </div>

                  <div className="input-group">
                    <label>Department</label>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. CSE" />
                    {errors.department && <p className="error-text">{errors.department}</p>}
                  </div>
                </div>

                <div className="input-group">
                  <label>Message / Query</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Describe your issue..." rows="5"></textarea>
                  {errors.message && <p className="error-text">{errors.message}</p>}
                </div>

                <button type="submit" className="submit-btn">Submit Grievance</button>
              </form>
            </>
          )}

          {/* TAB 2: Assigned to Me */}
          {activeTab === "assigned" && (
            <>
              <h2>Grievances Assigned to Me</h2>
              <p>These grievances were assigned to you by your department admin.</p>

              {loadingAssigned ? (
                <p>Loading assigned grievances...</p>
              ) : assignedGrievances.length === 0 ? (
                <div className="empty-state"><p>No grievances are currently assigned to you.</p></div>
              ) : (
                <div className="table-container">
                  <table className="grievance-table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>Category</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Submitted At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedGrievances.map((g) => (
                        <tr key={g._id}>
                          <td>{g.name}</td>
                          <td>{g.category}</td>
                          
                          {/* --- FIXED MESSAGE CELL (Max Width 150px + See More) --- */}
                          <td className="message-cell" style={{ maxWidth: '150px' }}>
                            {g.message.length > 20 ? (
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                                <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>
                                  {g.message.substring(0, 20)}...
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
                            ) : (
                              <span style={{ wordBreak: 'break-all' }}>{g.message}</span>
                            )}
                          </td>
                          {/* ---------------------------------------------------- */}

                          <td>
                            <span className={`status-badge status-${g.status.toLowerCase()}`}>
                              {g.status}
                            </span>
                          </td>
                          <td>{formatDate(g.createdAt)}</td>
                          <td>
                            {g.status !== "Resolved" && (
                              <>
                                {g.status !== "In Progress" && (
                                  <button
                                    className="resolve-btn"
                                    style={{ marginRight: "6px" }}
                                    onClick={() => handleUpdateAssignedStatus(g._id, "In Progress")}
                                  >
                                    In Progress
                                  </button>
                                )}
                                <button
                                  className="resolve-btn"
                                  onClick={() => handleUpdateAssignedStatus(g._id, "Resolved")}
                                >
                                  Mark Resolved
                                </button>
                              </>
                            )}
                            {g.status === "Resolved" && (
                              <button className="resolved-btn" disabled>Resolved</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB 3: My Submissions */}
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
                            {g.message.length > 20 ? (
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                                <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>
                                  {g.message.substring(0, 20)}...
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
                            ) : (
                              <span style={{ wordBreak: 'break-all' }}>{g.message}</span>
                            )}
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
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Grievance Details</h3>
              <button 
                onClick={() => setSelectedGrievance(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ fontSize: '0.95rem', color: '#334155' }}>
              <p style={{ marginBottom: '8px' }}><strong>Category:</strong> {selectedGrievance.category}</p>
              
              {selectedGrievance.name && (
                <p style={{ marginBottom: '8px' }}><strong>Submitted By:</strong> {selectedGrievance.name}</p>
              )}
              
              <p style={{ marginBottom: '8px' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', margin: '15px 0', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#1e293b' }}>Full Message:</strong>
                <p style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.5',
                  wordBreak: 'break-all',     
                  overflowWrap: 'anywhere' 
                }}>
                  {selectedGrievance.message}
                </p>
              </div>

              <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {selectedGrievance.status}</p>
            </div>

            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button 
                onClick={() => setSelectedGrievance(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e2e8f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#475569'
                }}
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