import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

function AdminStaffDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const staffId = localStorage.getItem("grievance_id")?.toUpperCase();

  const [staffName, setStaffName] = useState("");
  const [myDepartment, setMyDepartment] = useState(""); 
  
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");

  useEffect(() => {
    if (!role || role !== "staff") {
      navigate("/");
      return;
    }
  }, [role, navigate]);

  // 1. Fetch Staff Details
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const userRes = await fetch(`http://localhost:5000/api/auth/user/${staffId}`);
        const userData = await userRes.json();
        if (userRes.ok) setStaffName(userData.fullName || staffId);

        // Get Assigned Admin Department (Just for display purpose)
        const adminRes = await fetch(`http://localhost:5000/api/admin-staff/check/${staffId}`);
        const adminData = await adminRes.json();

        if (adminRes.ok && adminData.isAdmin && adminData.departments.length > 0) {
          setMyDepartment(adminData.departments[0]); 
        }
      } catch (err) {
        console.error("Error fetching staff info:", err);
      }
    };

    if (staffId) fetchStaffInfo();
  }, [staffId]);

  // 2. ✅ FIX: Fetch Grievances Assigned to THIS Staff ID
  // Pehle hum Department name se search kar rahe the, jo galat tha.
  // Ab hum 'assigned' endpoint call kar rahe hain.
  useEffect(() => {
    if (!staffId) return;

    const fetchMyAssignedGrievances = async () => {
      setLoading(true);
      setMsg("");
      try {
        const res = await fetch(
          `http://localhost:5000/api/grievances/assigned/${staffId}`
        );
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || "Failed to fetch data");
        
        setGrievances(data);
        
        if (data.length === 0) {
           setMsg("No grievances currently assigned to you.");
           setStatusType("info");
        }
      } catch (err) {
        console.error("Error fetching assigned grievances:", err);
        setMsg("Failed to load your assigned grievances.");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchMyAssignedGrievances();
  }, [staffId]);

  const updateStatus = async (id, newStatus) => {
    setMsg("Updating status...");
    setStatusType("info");
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          resolvedBy: staffId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setMsg("Status updated successfully!");
      setStatusType("success");

      // Update list locally
      setGrievances((prev) =>
        prev.map((g) => (g._id === id ? data.grievance : g))
      );
    } catch (err) {
      console.error("Error updating grievance:", err);
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
          <h1>Admin Staff Dashboard</h1>
          <p>Welcome, {staffName || staffId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title">
            <span>My Assigned Tasks</span>
          </li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Assigned Grievances</h2>
          <p style={{ marginBottom: "1rem", color: "#64748b" }}>
            Below are the grievances specifically assigned to you 
            {myDepartment ? ` (Department: ${myDepartment})` : ""}.
          </p>

          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {loading ? (
            <p>Loading grievances...</p>
          ) : grievances.length === 0 ? (
            <div className="empty-state">
              <p>No grievances found assigned to your ID.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
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
                      <td>{g.email}</td>
                      <td>{g.regid || "-"}</td>
                      <td className="message-cell">{g.message}</td>
                      <td>{formatDate(g.createdAt)}</td>
                      <td>
                        <span
                          className={`status-badge status-${g.status
                            .toLowerCase()
                            .replace(" ", "")}`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {g.status !== "Resolved" ? (
                            <button
                              className="action-btn resolve-btn"
                              onClick={() => updateStatus(g._id, "Resolved")}
                            >
                              Mark Resolved
                            </button>
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
    </div>
  );
}

export default AdminStaffDashboard;