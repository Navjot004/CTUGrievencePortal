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

function StudentWelfareAdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  useEffect(() => {
    if (!role || role !== "admin" || userId !== "ADM_WELFARE") {
      navigate("/");
    } else {
      fetchGrievances();
    }
  }, [role, userId, navigate]);

  const fetchGrievances = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/grievances/department/Student Welfare");
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
          <h1>Student Welfare Department</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Student Welfare Grievances</span></li>
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
                      <td className="message-cell">{g.message}</td>
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

      <AssignStaffPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        department="Student Welfare"
        grievanceId={selectedGrievanceId}
        adminId={userId}
        onAssigned={handleAssignSuccess}
      />
    </div>
  );
}

export default StudentWelfareAdminDashboard;