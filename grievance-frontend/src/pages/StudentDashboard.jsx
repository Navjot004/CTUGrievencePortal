// src/pages/StudentDashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
};

function StudentDashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role");
  const userId = localStorage.getItem("grievance_id");

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  // Route Protection
  useEffect(() => {
    if (!role || role !== "student") navigate("/");
  }, [role, navigate]);

  // Fetch user details for name
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setUserName(data.fullName || "");
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };
    if (userId) fetchUserDetails();
  }, [userId]);

  // Fetch History & Calculate Stats
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/grievances/user/${userId}`
        );
        const data = await res.json();

        if (res.ok) {
          setHistory(data);
          const pending = data.filter(
            (g) => g.status !== "Resolved" && g.status !== "Rejected"
          ).length;
          const resolved = data.filter((g) => g.status === "Resolved").length;
          setStats({ total: data.length, pending, resolved });
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchHistory();
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <p>Welcome, {userName || userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* ✅ NAVBAR: Dashboard is Active */}
      <nav className="navbar">
  <ul>
    <li><Link to="/student/dashboard">Dashboard</Link></li>
    <li><Link to="/student/welfare">Student Welfare</Link></li>
    <li><Link to="/student/admission">Admission</Link></li>
    <li><Link to="/student/accounts">Accounts</Link></li>
    <li><Link to="/student/examination">Examination</Link></li>
    <li><Link to="/student/department">Department</Link></li> {/* Add This */}
  </ul>
</nav>

      <main className="dashboard-body">
        {/* ✅ VISUAL STATS */}
        <div className="stats-row">
          <div className="stat-card total">
            <h3>Total Grievances</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <p>{stats.pending}</p>
          </div>
          <div className="stat-card resolved">
            <h3>Resolved</h3>
            <p>{stats.resolved}</p>
          </div>
        </div>

        {/* ✅ HISTORY TABLE */}
        <div className="card">
          <h2>My Grievance History</h2>

          {loading ? (
            <p>Loading history...</p>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>You haven't submitted any grievances yet.</p>
              <div style={{ marginTop: "15px" }}>
                <Link
                  to="/student/welfare"
                  style={{ color: "#2563eb", fontWeight: "600" }}
                >
                  Submit your first grievance
                </Link>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Admin Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((g) => (
                    <tr key={g._id}>
                      <td>{formatDate(g.createdAt)}</td>
                      <td>{g.category}</td>
                      <td className="message-cell">
                        {g.message.substring(0, 60)}...
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${g.status
                            .toLowerCase()
                            .replace(" ", "")}`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td>{g.resolutionRemarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <button className="logout-floating" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default StudentDashboard;
