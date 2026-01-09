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
      const res = await fetch(`http://localhost:5000/api/grievances/${id}`, {
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
                    <td className="message-cell" onClick={() => setSelectedGrievance(g)} style={{cursor:'pointer', textDecoration:'underline'}}>{g.message.substring(0, 30)}...</td>
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
        </div>
      </main>

      {/* Popups */}
      {selectedGrievance && (
        <div className="chat-modal-overlay" onClick={() => setSelectedGrievance(null)}>
           <div className="chat-modal" style={{height:'auto', padding:'20px'}}>
              <h3>Details</h3>
              <p>{selectedGrievance.message}</p>
              <button className="close-btn" onClick={() => setSelectedGrievance(null)}>Close</button>
           </div>
        </div>
      )}
      
      <AssignStaffPopup isOpen={isAssignPopupOpen} onClose={() => setIsAssignPopupOpen(false)} department="Accounts" grievanceId={assignGrievanceId} adminId={userId} onAssigned={(m, t) => {setMsg(m); setStatusType(t); fetchGrievances()}} />

    </div>
  );
}

export default AccountAdminDashboard;