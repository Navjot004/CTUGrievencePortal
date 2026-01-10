import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";
import AssignStaffPopup from "../components/AssignStaffPopup";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function AccountAdminDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  const adminDept = localStorage.getItem("admin_department");
  const isDeptAdmin = localStorage.getItem("is_dept_admin") === "true";
  const role = localStorage.getItem("grievance_role");

  // State
  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  
  // Modals
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [assignGrievanceId, setAssignGrievanceId] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    // ✅ Auth Check: Must be Admin OR Staff with Admin Rights for "Accounts"
    const isAuthorized = (userId === "10001") || // Master
                         (adminDept === "Accounts" && (role === "admin" || isDeptAdmin));

    if (!isAuthorized) {
      navigate("/");
    } else {
      fetchGrievances();
    }
  }, [userId, adminDept, role, isDeptAdmin, navigate]);

  const fetchGrievances = async () => {
    try {
      const safeCategory = encodeURIComponent("Accounts");
      const url = `http://localhost:5000/api/grievances/department/Accounts?category=${safeCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch data");
      setGrievances(await res.json());
    } catch (error) {
      setMsg("Failed to load grievances");
      setStatusType("error");
    }
  };

  const updateStatus = async (id, newStatus) => {
    setMsg("Updating...");
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolvedBy: userId }),
      });
      if (!res.ok) throw new Error("Update failed");
      setMsg("Status updated!");
      setStatusType("success");
      fetchGrievances(); 
    } catch (err) {
      setMsg(err.message);
      setStatusType("error");
    }
  };

  const confirmResolve = (g) => {
    const confirmMsg = g.assignedTo 
      ? `⚠️ Professional Action Required\n\nThis grievance is currently assigned to Staff ID: ${g.assignedTo}.\n\nMarking it as 'Resolved' will close the ticket and override the active assignment.\n\nAre you sure you want to proceed?`
      : "Are you sure you want to mark this grievance as Resolved?";

    if (window.confirm(confirmMsg)) {
      updateStatus(g._id, "Resolved");
    }
  };

  const openAssignPopup = (id) => { setAssignGrievanceId(id); setIsAssignPopupOpen(true); };
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Accounts Department</h1>
          <p>Admin: {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Accounts Queue</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Incoming Grievances</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}
          
          <div className="table-container">
            <table className="grievance-table">
              <thead><tr><th>Name</th><th>Message</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g._id}>
                    <td>{g.name}</td>
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
                    <td><span className={`status-badge status-${g.status.toLowerCase()}`}>{g.status}</span></td>
                    <td>
                       <div className="action-buttons">
                         <button 
                           className="action-btn assign-btn" 
                           onClick={() => openAssignPopup(g._id)}
                           disabled={g.status === "Resolved" || g.assignedTo}
                           style={{ opacity: (g.status === "Resolved" || g.assignedTo) ? 0.5 : 1, cursor: (g.status === "Resolved" || g.assignedTo) ? "not-allowed" : "pointer" }}
                         >
                           Assign
                         </button>
                         <button 
                           className="action-btn resolve-btn" 
                           onClick={() => confirmResolve(g)}
                           disabled={g.status === "Resolved"}
                           style={{ opacity: g.status === "Resolved" ? 0.5 : 1, cursor: g.status === "Resolved" ? "not-allowed" : "pointer", marginLeft: "5px" }}
                         >
                           Resolve
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Popups */}
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
              <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Student:</strong> {selectedGrievance.name} <span style={{color:'#94a3b8'}}>({selectedGrievance.userId || selectedGrievance.regid || 'N/A'})</span></p>
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
      
      <AssignStaffPopup isOpen={isAssignPopupOpen} onClose={() => setIsAssignPopupOpen(false)} department="Accounts" grievanceId={assignGrievanceId} adminId={userId} onAssigned={(m, t) => {setMsg(m); setStatusType(t); fetchGrievances()}} />

    </div>
  );
}

export default AccountAdminDashboard;