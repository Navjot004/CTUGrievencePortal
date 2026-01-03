import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

function AdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();

  // ✅ New State for Popup
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");

  useEffect(() => {
    if (!role || role !== "admin") {
       navigate("/");
    } else {
      fetchGrievances();
    }
  }, [role, navigate]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grievances/all");
      if (!res.ok) throw new Error("Failed to fetch grievances");
      const data = await res.json();
      setGrievances(data);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  const handleAssign = async (id, dept) => {
    if (!dept) return;

    setMsg("Assigning grievance...");
    setStatusType("info");

    try {
      const deptMap = {
        Accounts: "ADM_ACCOUNT",
        Admission: "ADM_ADMISSION",
        "Student Welfare": "ADM_WELFARE",
        Examination: "ADM_EXAM",
        Department: "ADM_DEPT", 
      };

      const targetAdminId = deptMap[dept];
      if (!targetAdminId) {
        throw new Error("Invalid department selected");
      }

      const res = await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Assigned",
          assignedTo: targetAdminId,
          assignedRole: "admin",
          assignedBy: userId || "ADM_MASTER",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign");

      setMsg(`Assigned grievance to ${dept}`);
      setStatusType("success");
      
      setGrievances((prev) =>
        prev.map((g) => (g._id === id ? data.grievance : g))
      );
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Main Admin Dashboard</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Grievance Triage</span></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>All Incoming Grievances</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {grievances.length === 0 ? (
            <div className="empty-state"><p>No grievances found.</p></div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Message</th>
                    <th>Submitted At</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Assign Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grievances.map((g) => (
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

                      <td>{formatDate(g.createdAt)}</td>
                      <td>
                        <span className={`status-badge status-${g.status.toLowerCase()}`}>
                          {g.status}
                        </span>
                      </td>
                      <td>{g.assignedTo || "Not Assigned"}</td>
                      <td>
                        {g.status !== "Resolved" ? (
                          <select
                            className="assign-select"
                            value=""
                            onChange={(e) => handleAssign(g._id, e.target.value)}
                          >
                            <option value="">Assign to...</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Admission">Admission</option>
                            <option value="Student Welfare">Student Welfare</option>
                            <option value="Examination">Examination</option>
                            <option value="Department">Department</option>
                          </select>
                        ) : (
                          "Resolved"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- POPUP MODAL (Fixed for Long Text) --- */}
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
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Grievance Details</h3>
                  <button 
                    onClick={() => setSelectedGrievance(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
                  >
                    &times;
                  </button>
                </div>
                
                {/* Modal Body */}
                <div style={{ fontSize: '0.95rem', color: '#334155' }}>
                  <p style={{ marginBottom: '8px' }}><strong>Category:</strong> {selectedGrievance.category}</p>
                  <p style={{ marginBottom: '8px' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
                  <p style={{ marginBottom: '8px' }}><strong>Assigned To:</strong> {selectedGrievance.assignedTo || "Unassigned"}</p>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', margin: '15px 0', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#1e293b' }}>Full Message:</strong>
                    
                    {/* --- FIXED: Break-all added here --- */}
                    <p style={{ 
                      margin: 0, 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: '1.5',
                      wordBreak: 'break-all',     
                      overflowWrap: 'anywhere' 
                    }}>
                      {selectedGrievance.message}
                    </p>
                    {/* ----------------------------------- */}

                  </div>

                  <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {selectedGrievance.status}</p>
                </div>

                {/* Modal Footer */}
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

        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;