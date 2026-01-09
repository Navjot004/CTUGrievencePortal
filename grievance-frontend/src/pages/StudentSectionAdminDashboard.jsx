import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";
import AssignStaffPopup from "../components/AssignStaffPopup";

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

function StudentSectionAdminDashboard() {
  const navigate = useNavigate();

  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  const adminDept = localStorage.getItem("admin_department");

  const [grievances, setGrievances] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(true);

  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [assignGrievanceId, setAssignGrievanceId] = useState(null);

  useEffect(() => {
    if (adminDept !== "Student Section") {
      console.warn("Wrong Department Access");
    }
    fetchGrievances();
  }, [adminDept]);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const category = encodeURIComponent("Student Section");
      const url = `http://localhost:5000/api/grievances/category/${category}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setGrievances(data);
    } catch (err) {
      console.error(err);
      setMsg("Failed to load grievances");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const resolveGrievance = async (id) => {
    if (!window.confirm("Resolve this grievance?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved", resolvedBy: userId }),
      });
      if (!res.ok) throw new Error("Resolve failed");
      setMsg("✅ Grievance resolved");
      setStatusType("success");
      fetchGrievances();
    } catch (err) {
      setMsg(err.message);
      setStatusType("error");
    }
  };

  const openAssignPopup = (id) => {
    setAssignGrievanceId(id);
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
          <h1>Student Section Department</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Student Section Grievances</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Incoming Grievances</h2>
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {loading ? (
            <p>Loading...</p>
          ) : grievances.length === 0 ? (
            <p>No grievances found for Student Section.</p>
          ) : (
            <table className="grievance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g._id}>
                    <td>{g.name}</td>
                    <td title={g.message}>{g.message.length > 40 ? g.message.slice(0, 40) + "..." : g.message}</td>
                    <td>
                      <span className={`status-badge status-${g.status.toLowerCase()}`}>{g.status}</span>
                    </td>
                    <td>
                      {g.status !== "Resolved" && (
                        <>
                          <button className="action-btn assign-btn" onClick={() => openAssignPopup(g._id)}>Assign</button>
                          <button className="action-btn resolve-btn" onClick={() => resolveGrievance(g._id)}>Resolve</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <AssignStaffPopup
        isOpen={isAssignPopupOpen}
        onClose={() => setIsAssignPopupOpen(false)}
        department="Student Section"
        grievanceId={assignGrievanceId}
        adminId={userId}
        onAssigned={handleAssignSuccess}
      />

    </div>
  );
}

export default StudentSectionAdminDashboard;
