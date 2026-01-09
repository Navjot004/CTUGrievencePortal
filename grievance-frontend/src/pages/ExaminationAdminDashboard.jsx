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

function ExaminationAdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  const adminDept = localStorage.getItem("admin_department");
  const isDeptAdmin = localStorage.getItem("is_dept_admin") === "true";

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  
  // Modals
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [assignGrievanceId, setAssignGrievanceId] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    // ✅ Auth Check for Examination
    const isAuthorized = (userId === "10001") || 
                         (adminDept === "Examination" && (role === "admin" || isDeptAdmin));

    if (!isAuthorized) {
      navigate("/");
    } else {
      fetchGrievances();
    }
  }, [role, userId, adminDept, isDeptAdmin, navigate]);

  const fetchGrievances = async () => {
    try {
      const safeCategory = encodeURIComponent("Examination");
      const url = `http://localhost:5000/api/grievances/department/Examination?category=${safeCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setGrievances(data);
    } catch (error) {
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
    setAssignGrievanceId(grievanceId);
    setIsAssignPopupOpen(true);
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
          <h1>Examination Department</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Examination Grievances</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Incoming Grievances</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {grievances.length === 0 ? (
            <div className="empty-state">
              <p>No grievances found for the Examination Department.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reg. ID</th>
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
                      <td>{g.regid}</td>

                      {/* --- Message Cell --- */}
                      <td className="message-cell" style={{ maxWidth: '150px' }}>
                        {g.message.length > 20 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>{g.message.substring(0, 20)}...</span>
                            <button onClick={() => setSelectedGrievance(g)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', textDecoration: 'underline' }}>See more</button>
                          </div>
                        ) : (<span style={{ wordBreak: 'break-all' }}>{g.message}</span>)}
                      </td>

                      <td>{formatDate(g.createdAt)}</td>
                      <td>
                        <span className={`status-badge status-${g.status.toLowerCase()}`}>
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {g.status !== "Resolved" ? (
                            <>
                              <button className="action-btn assign-btn" onClick={() => openAssignPopup(g._id)}>Assign</button>
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

      {/* Details Modal */}
      {selectedGrievance && (
        <div onClick={() => setSelectedGrievance(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3>Grievance Details</h3>
            <p style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{selectedGrievance.message}</p>
            <button onClick={() => setSelectedGrievance(null)}>Close</button>
          </div>
        </div>
      )}

      <AssignStaffPopup isOpen={isAssignPopupOpen} onClose={() => setIsAssignPopupOpen(false)} department="Examination" grievanceId={assignGrievanceId} adminId={userId} onAssigned={handleAssignSuccess} />

    </div>
  );
}

export default ExaminationAdminDashboard;