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

                        <td className="message-cell" style={{ maxWidth: '200px' }}>
                          {g.attachment && <span style={{ marginRight: "5px", fontSize: "1.1rem" }} title="Has Attachment">📎</span>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <span style={{ wordBreak: 'break-word', lineHeight: '1.3' }}>
                              {g.message.substring(0, 30)}{g.message.length > 30 ? "..." : ""}
                            </span>
                            <button 
                              onClick={() => setSelectedGrievance(g)}
                              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'underline', padding: 0 }}
                            >
                              See more
                            </button>
                          </div>
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
            onClick={() => setSelectedGrievance(null)}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
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
                <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Category:</strong> {selectedGrievance.category || selectedGrievance.school || "N/A"}</p>
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
      </main>
    </div>
  );
}

export default AdminDashboard;
