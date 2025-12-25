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

function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();

  // ✅ 1. Map Admin ID to Exact School Name (Must match AdminManageStaff dropdown)
  const adminTitleMap = {
    "ADM_ENG": "School of Engineering",
    "ADM_MGMT": "School of Management",
    "ADM_HOTEL": "Hotel Management", // Ensure this matches exactly what you selected while adding staff
    "ADM_LAW": "School of Law",
    "ADM_PHARMA": "Pharmaceutical Sciences",
    "ADM_DESIGN": "Design & Innovation",
    "ADM_HEALTH": "Allied Health Sciences",
    "ADM_SOCIAL": "Social Sciences",
    "ADM_DEPT": "Academic Department" // Fallback
  };

  const currentSchoolName = adminTitleMap[userId] || "Academic Department";

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState(""); 
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState(null);

  useEffect(() => {
    // Only allow School Admins
    if (!role || role !== "admin" || !adminTitleMap[userId]) {
      navigate("/");
    } else {
      fetchMySchoolGrievances();
    }
  }, [role, userId, navigate]);

  const fetchMySchoolGrievances = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/assigned/${userId}`);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("Status updated successfully!");
      setStatusType("success");
      fetchMySchoolGrievances(); 
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
    fetchMySchoolGrievances(); 
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{currentSchoolName} Dashboard</h1>
          <p>Welcome, HOD ({userId})</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>My School Grievances</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Department Issues</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {grievances.length === 0 ? (
            <div className="empty-state">
              <p>No grievances currently assigned to your school.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Reg ID</th>
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
                      <td className="message-cell">{g.message}</td>
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
        // ✅ FIX: Pass the ACTUAL school name (e.g., "School of Engineering") instead of "Department"
        department={currentSchoolName} 
        grievanceId={selectedGrievanceId}
        adminId={userId}
        onAssigned={handleAssignSuccess}
      />
    </div>
  );
}

export default SchoolAdminDashboard;