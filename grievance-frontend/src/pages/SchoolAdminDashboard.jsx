import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";
import AssignStaffPopup from "../components/AssignStaffPopup";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  
  // ✅ DYNAMIC: Get Department from LocalStorage
  const mySchoolName = localStorage.getItem("admin_department"); 
  const isAuthorized = !!mySchoolName; // Must have a department assigned

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [assignGrievanceId, setAssignGrievanceId] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    if (!isAuthorized) {
      navigate("/");
    } else {
      fetchMySchoolGrievances();
    }
  }, [navigate, isAuthorized]);

  const fetchMySchoolGrievances = async () => {
    try {
      // Fetch grievances by CATEGORY (school name) instead of assigned
      // This shows ALL grievances for this school, not just assigned ones
      const category = encodeURIComponent(mySchoolName);
      const res = await fetch(`http://localhost:5000/api/grievances/category/${category}`);
      if (res.ok) setGrievances(await res.json());
      else console.error("Failed to fetch grievances");
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setMsg("Updating...");
    try {
      await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolvedBy: userId }),
      });
      setMsg("Updated!");
      setStatusType("success");
      fetchMySchoolGrievances(); 
    } catch (err) {
      setMsg("Error updating");
    }
  };

  const openAssignPopup = (id) => { setAssignGrievanceId(id); setIsAssignPopupOpen(true); };
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{mySchoolName || "School"} Dashboard</h1>
          <p>Admin: {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Department Issues</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Grievances Assigned to {mySchoolName}</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {grievances.length === 0 ? <div className="empty-state"><p>No pending issues.</p></div> : (
            <div className="table-container">
              <table className="grievance-table">
                <thead><tr><th>Student</th><th>Message</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {grievances.map((g) => (
                    <tr key={g._id}>
                      <td>{g.name}</td>
                      <td className="message-cell" onClick={() => setSelectedGrievance(g)} style={{cursor:'pointer', textDecoration:'underline'}}>{g.message.substring(0, 30)}...</td>
                      <td>{formatDate(g.createdAt)}</td>
                      <td><span className={`status-badge status-${g.status.toLowerCase()}`}>{g.status}</span></td>
                      <td>
                        <div className="action-buttons">
                          {g.status !== "Resolved" && (
                             <>
                               <button className="action-btn assign-btn" onClick={() => openAssignPopup(g._id)}>Assign</button>
                               <button className="action-btn resolve-btn" onClick={() => updateStatus(g._id, "Resolved")}>Resolve</button>
                             </>
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
        <div className="chat-modal-overlay" onClick={() => setSelectedGrievance(null)}>
           <div className="chat-modal" style={{height:'auto', padding:'20px'}}>
              <h3>Details</h3>
              <p>{selectedGrievance.message}</p>
              <button className="close-btn" onClick={() => setSelectedGrievance(null)}>Close</button>
           </div>
        </div>
      )}

      <AssignStaffPopup isOpen={isAssignPopupOpen} onClose={() => setIsAssignPopupOpen(false)} department={mySchoolName} grievanceId={assignGrievanceId} adminId={userId} onAssigned={(m, t) => {setMsg(m); setStatusType(t); fetchMySchoolGrievances()}} />

    </div>
  );
}

export default SchoolAdminDashboard;