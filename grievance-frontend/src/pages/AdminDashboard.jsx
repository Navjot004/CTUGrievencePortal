import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

import AdminUploadRecords from "../components/AdminUploadRecords";
import StaffRoleManager from "../components/StaffRoleManager";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminDashboard() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const isDeptAdmin = localStorage.getItem("is_dept_admin") === "true";

  const isMasterAdmin = userId === "10001";
  const canManageStaff = isMasterAdmin || isDeptAdmin;

  const [activeTab, setActiveTab] = useState("triage");
  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    if (!isMasterAdmin && !isDeptAdmin) {
      navigate("/");
    } else {
      fetchAllGrievances();
    }
  }, [navigate]);

  const fetchAllGrievances = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grievances/all");
      if (!res.ok) throw new Error("Failed to fetch grievances");
      const data = await res.json();
      setGrievances(data);
    } catch (err) {
      setMsg(err.message);
      setStatusType("error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* NAV */}
      <nav className="navbar">
        <ul>
          <li
            className={activeTab === "triage" ? "active" : ""}
            onClick={() => setActiveTab("triage")}
          >
            <span className="tab-link-button">All Grievances</span>
          </li>

          <li
            className={activeTab === "upload" ? "active" : ""}
            onClick={() => setActiveTab("upload")}
          >
            <span className="tab-link-button">Upload Records</span>
          </li>

          {canManageStaff && (
            <li
              className={activeTab === "staff" ? "active" : ""}
              onClick={() => setActiveTab("staff")}
            >
              <span className="tab-link-button">Manage Staff</span>
            </li>
          )}
        </ul>
      </nav>

      {/* BODY */}
      <main className="dashboard-body">
        {activeTab === "upload" && <AdminUploadRecords />}
        {activeTab === "staff" && canManageStaff && <StaffRoleManager />}

        {activeTab === "triage" && (
          <div className="card">
            <h2>All Incoming Grievances (Read Only)</h2>

            {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

            {grievances.length === 0 ? (
              <p>No grievances found.</p>
            ) : (
              <div className="table-container">
                <table className="grievance-table">
                  <thead>
                    <tr>
                      <th>Department / Category</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Assigned Staff</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grievances.map((g) => (
                      <tr key={g._id}>
                        <td>{g.category || g.school || "N/A"}</td>

                        <td className="message-cell">
                          {g.message.length > 30 ? (
                            <>
                              {g.message.substring(0, 30)}...
                              <button
                                className="link-btn"
                                onClick={() => setSelectedGrievance(g)}
                              >
                                View
                              </button>
                            </>
                          ) : (
                            g.message
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${g.status
                              .toLowerCase()
                              .replace(" ", "")}`}
                          >
                            {g.status}
                          </span>
                        </td>

                        <td>{g.assignedTo || "—"}</td>
                        <td>{formatDate(g.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL */}
        {selectedGrievance && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedGrievance(null)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Grievance Details</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {selectedGrievance.message}
              </p>
              <button onClick={() => setSelectedGrievance(null)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
