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
        Department: "ADM_DEPT", // ✅ NEW
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
          assignedBy: userId || "ADM01",
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
                      <td className="message-cell">{g.message}</td>
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
                            <option value="Department">Department</option> {/* ✅ NEW */}
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
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;