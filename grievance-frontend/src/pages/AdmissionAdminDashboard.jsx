import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";
import AssignStaffPopup from "../components/AssignStaffPopup";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

function AdmissionAdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  
  // State for Assign Staff Popup
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  // ✅ State for "See More" Details Popup
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    if (!role || role !== "admin" || userId !== "ADM_ADMISSION") {
      navigate("/");
    } else {
      fetchGrievances();
    }
  }, [role, userId, navigate]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grievances/department/Admission");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setGrievances(data);
    } catch (error) {
      console.error(error);
      setMsg("Failed to load grievances");
      setStatusType("error");
    }
  };

  const updateStatus = async (id, newStatus) => {
    setMsg("Updating status...");
    setStatusType("info");
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolvedBy: userId }),
      });
      if (!res.ok) throw new Error("Update failed");
      setMsg("Status updated successfully!");
      setStatusType("success");
      fetchGrievances(); 
    } catch (err) {
      setMsg(`Error: ${err.message}`);
      setStatusType("error");
    }
  };

  const openAssignPopup = (grievanceId) => {
    setSelectedGrievanceId(grievanceId);
    setIsPopupOpen(true);
  };

  const handleAssignSuccess = (message, type) => {
    setMsg(message);
    setStatusType(type);
    fetchGrievances();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admission Department</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Admission Grievances</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Incoming Grievances</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {grievances.length === 0 ? (
            <div className="empty-state"><p>No grievances found.</p></div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
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
                      <td>{g.email}</td>

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
                        <span className={`status-badge status-${g.status.toLowerCase()}`}>{g.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {g.status !== "Resolved" ? (
                            <>
                              <button className="action-btn assign-btn" onClick={() => openAssignPopup(g._id)}>Assign Staff</button>
                              <button className="action-btn resolve-btn" onClick={() => updateStatus(g._id, "Resolved")}>Mark Resolved</button>
                            </>
                          ) : (
                            <span className="done-btn">Resolved</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <p style={{ marginBottom: '8px' }}><strong>Name:</strong> {selectedGrievance.name}</p>
              <p style={{ marginBottom: '8px' }}><strong>Email:</strong> {selectedGrievance.email}</p>
              <p style={{ marginBottom: '8px' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
              
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

      {/* Existing Assign Staff Popup */}
      <AssignStaffPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        department="Admission"
        grievanceId={selectedGrievanceId}
        adminId={userId}
        onAssigned={handleAssignSuccess}
      />
    </div>
  );
}

export default AdmissionAdminDashboard;