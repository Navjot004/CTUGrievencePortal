// src/pages/StaffAdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

// Helper function to format dates
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

function StaffAdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const staffId = localStorage.getItem("grievance_id")?.toUpperCase();
  const isAdminStaffFlag =
    localStorage.getItem("grievance_staff_isAdmin") === "true";

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState(""); // success | error | info
  const [loading, setLoading] = useState(true);

  // Route protection: must be staff + admin staff
  useEffect(() => {
    if (!role || role !== "staff" || !staffId) {
      navigate("/");
      return;
    }

    // If flag says not admin, send to normal staff page
    if (!isAdminStaffFlag) {
      navigate("/staff/general");
      return;
    }

    // Verify with backend (in case flag is stale)
    const checkAdminStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/admin-staff/check/${staffId}`
        );
        if (!res.ok) throw new Error("Failed to verify admin staff status");
        const data = await res.json();

        if (!data.isAdmin) {
          // No longer admin → send to normal staff
          localStorage.setItem("grievance_staff_isAdmin", "false");
          navigate("/staff/general");
          return;
        }

        setDepartments(data.departments || []);
        if (data.departments && data.departments.length > 0) {
          setSelectedDepartment(data.departments[0]);
        }
      } catch (err) {
        console.error("Error verifying admin staff:", err);
        setMsg("Failed to verify admin staff status");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [role, staffId, isAdminStaffFlag, navigate]);

  // Fetch grievances when department changes
  useEffect(() => {
    const fetchGrievances = async () => {
      if (!selectedDepartment) return;
      setMsg("Loading grievances...");
      setStatusType("info");
      try {
        const encodedDept = encodeURIComponent(selectedDepartment);
        const res = await fetch(
          `http://localhost:5000/api/grievances/department/${encodedDept}`
        );
        if (!res.ok) throw new Error("Failed to fetch grievances");
        const data = await res.json();
        setGrievances(data);
        if (data.length === 0) {
          setMsg(`No grievances found for ${selectedDepartment} department.`);
          setStatusType("info");
        } else {
          setMsg("");
          setStatusType("");
        }
      } catch (err) {
        console.error("Error fetching grievances:", err);
        setMsg("Error loading grievances");
        setStatusType("error");
      }
    };

    if (selectedDepartment) {
      fetchGrievances();
    }
  }, [selectedDepartment]);

  // Update status (mark resolved / in progress etc.)
  const updateStatus = async (id, newStatus) => {
    setMsg("Updating status...");
    setStatusType("info");
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolvedBy: staffId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update grievance");

      setMsg("Status updated successfully!");
      setStatusType("success");

      // Refresh list locally
      setGrievances((prev) =>
        prev.map((g) => (g._id === id ? data.grievance : g))
      );
    } catch (err) {
      console.error("Error updating grievance:", err);
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const goToStaffForm = () => {
    navigate("/staff/general");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Department Admin (Staff)</h1>
          <p>Welcome, {staffId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Simple navbar for admin staff */}
      <nav className="navbar">
        <ul>
          <li className="admin-nav-title">
            <span>Department Grievance Management</span>
          </li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Manage Department Grievances</h2>
          <p>
            You are assigned as <strong>admin staff</strong> for the selected
            department. You can review and resolve grievances here. To file your
            own grievance as staff,{" "}
            <button
              type="button"
              onClick={goToStaffForm}
              style={{
                border: "none",
                background: "none",
                color: "#2563eb",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.95rem",
              }}
            >
              click here
            </button>
            .
          </p>

          {loading ? (
            <p>Checking your admin staff permissions...</p>
          ) : (
            <>
              {/* Department Selector (if multiple) */}
              {departments.length > 1 && (
                <div className="input-group" style={{ maxWidth: "300px" }}>
                  <label>Select Department</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

              {grievances.length === 0 && !msg ? (
                <div className="empty-state">
                  <p>No grievances found for this department.</p>
                </div>
              ) : grievances.length > 0 ? (
                <div className="table-container">
                  <table className="grievance-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Reg./Staff ID</th>
                        <th>Email</th>
                        <th>School / Dept</th>
                        <th>Category</th>
                        <th>Message</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grievances.map((g) => (
                        <tr key={g._id}>
                          <td>{g.name}</td>
                          <td>{g.regid || g.userId}</td>
                          <td>{g.email}</td>
                          <td>{g.school}</td>
                          <td>{g.category}</td>
                          <td className="message-cell">{g.message}</td>
                          <td>{formatDate(g.createdAt)}</td>
                          <td>
                            <span
                              className={`status-badge status-${g.status.toLowerCase()}`}
                            >
                              {g.status}
                            </span>
                          </td>
                          <td>
                            {g.status !== "Resolved" ? (
                              <>
                                <button
                                  className="resolve-btn"
                                  style={{ marginBottom: "6px" }}
                                  onClick={() =>
                                    updateStatus(g._id, "In Progress")
                                  }
                                >
                                  Mark In Progress
                                </button>
                                <button
                                  className="resolved-btn"
                                  onClick={() =>
                                    updateStatus(g._id, "Resolved")
                                  }
                                >
                                  Mark Resolved
                                </button>
                              </>
                            ) : (
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
              ) : null}
            </>
          )}
        </div>
      </main>

      <button className="logout-floating" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default StaffAdminDashboard;
