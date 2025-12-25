import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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

    // Map selectedCategory to readable category for backend
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
          phone: "", // optional for staff, you can add if needed
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

      // Refresh "My Submissions" tab
      fetchMyGrievances();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  // Staff updates status of assigned grievance
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

      // Refresh both lists
      fetchAssignedGrievances();
      fetchMyGrievances();
    } catch (err) {
      console.error("Error updating assigned grievance:", err);
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  // Human-readable category title
  const prettyCategoryTitle = (key) => {
    if (key === "general") return "General";
    if (key === "administration") return "Administration";
    if (key === "finance") return "Finance";
    if (key === "facilities") return "Facilities";
    return key;
  };

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
        {/* ✅ ADDED: Logout Button in Header */}
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Tabs for Staff */}
      <nav className="navbar">
        <ul>
          <li className={activeTab === "submit" ? "active" : ""}>
            <button
              className="tab-link-button"
              onClick={() => setActiveTab("submit")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              Submit Grievance
            </button>
          </li>
          <li className={activeTab === "assigned" ? "active" : ""}>
            <button
              className="tab-link-button"
              onClick={() => setActiveTab("assigned")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              Assigned to Me
            </button>
          </li>
          <li className={activeTab === "mine" ? "active" : ""}>
            <button
              className="tab-link-button"
              onClick={() => setActiveTab("mine")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              My Submissions
            </button>
          </li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          {/* Alert messages */}
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {/* TAB 1: Submit Grievance */}
          {activeTab === "submit" && (
            <>
              <h2>Submit Staff Grievance</h2>
              <p>
                Select a category and describe your issue. It will be routed to the appropriate department.
              </p>

              {/* Category mini-tabs inside submit */}
              <div className="dashboard-tabs" style={{ marginTop: "1rem" }}>
                <button
                  className={`tab-btn ${
                    selectedCategory === "general" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedCategory("general")}
                >
                  General
                </button>
                <button
                  className={`tab-btn ${
                    selectedCategory === "administration" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedCategory("administration")}
                >
                  Administration
                </button>
                <button
                  className={`tab-btn ${
                    selectedCategory === "finance" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedCategory("finance")}
                >
                  Finance
                </button>
                <button
                  className={`tab-btn ${
                    selectedCategory === "facilities" ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedCategory("facilities")}
                >
                  Facilities
                </button>
              </div>

              <p style={{ marginTop: "0.75rem", color: "#64748b" }}>
                Current Category:{" "}
                <strong>{prettyCategoryTitle(selectedCategory)}</strong>
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                    />
                    {errors.name && <p className="error-text">{errors.name}</p>}
                  </div>

                  <div className="input-group">
                    <label>Staff ID</label>
                    <input
                      type="text"
                      name="staffId"
                      value={formData.staffId}
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
                      onChange={handleChange}
                      placeholder="you@college.edu"
                    />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                  </div>

                  <div className="input-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. CSE, Management, etc."
                    />
                    {errors.department && (
                      <p className="error-text">{errors.department}</p>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label>Message / Query</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your issue in detail..."
                    rows="5"
                  ></textarea>
                  {errors.message && (
                    <p className="error-text">{errors.message}</p>
                  )}
                </div>

                <button type="submit" className="submit-btn">
                  Submit Grievance
                </button>
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
                <div className="empty-state">
                  <p>No grievances are currently assigned to you.</p>
                </div>
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
                          <td className="message-cell">{g.message}</td>
                          <td>
                            <span
                              className={`status-badge status-${g.status.toLowerCase()}`}
                            >
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
                                    onClick={() =>
                                      handleUpdateAssignedStatus(g._id, "In Progress")
                                    }
                                  >
                                    In Progress
                                  </button>
                                )}
                                <button
                                  className="resolve-btn"
                                  onClick={() =>
                                    handleUpdateAssignedStatus(g._id, "Resolved")
                                  }
                                >
                                  Mark Resolved
                                </button>
                              </>
                            )}
                            {g.status === "Resolved" && (
                              <button className="resolved-btn" disabled>
                                Resolved
                              </button>
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
                <div className="empty-state">
                  <p>You have not submitted any grievances yet.</p>
                </div>
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
                          <td className="message-cell">{g.message}</td>
                          <td>
                            <span
                              className={`status-badge status-${g.status.toLowerCase()}`}
                            >
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

      {/* Floating logout (mobile) */}
      <button className="logout-floating" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default StaffDashboard;