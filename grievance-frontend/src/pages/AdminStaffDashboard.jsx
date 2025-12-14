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
  const [selectedDept, setSelectedDept] = useState("Accounts");
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/user/${staffId}`
        );
        const data = await res.json();
        if (res.ok) {
          setStaffName(data.fullName || staffId);
        } else {
          setStaffName(staffId || "Staff");
        }
      } catch (err) {
        console.error("Error fetching staff info:", err);
        setStaffName(staffId || "Staff");
      }
    };
    if (staffId) fetchUser();
  }, [staffId]);

  useEffect(() => {
    if (!selectedDept) return;

    const fetchDeptGrievances = async () => {
      setLoading(true);
      setMsg("");
      try {
        const res = await fetch(
          `http://localhost:5000/api/grievances/department/${encodeURIComponent(
            selectedDept
          )}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch data");
        setGrievances(data);
      } catch (err) {
        console.error("Error fetching dept grievances:", err);
        setMsg("Failed to load grievances for this department.");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchDeptGrievances();
  }, [selectedDept]);

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

  const goToStaffForm = () => {
    navigate("/staff/general");
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
            <span>Handle Student Grievances</span>
          </li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Department Grievances</h2>
          <p style={{ marginBottom: "1rem", color: "#64748b" }}>
            Select a department queue and help resolve student grievances
            assigned to your team.
          </p>

          <div className="form-row" style={{ marginBottom: "1rem" }}>
            <div className="input-group">
              <label>Department Queue</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="Accounts">Accounts</option>
                <option value="Admission">Admission</option>
                <option value="Student Welfare">Student Welfare</option>
                <option value="Examination">Examination</option>
              </select>
            </div>
          </div>

          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {loading ? (
            <p>Loading grievances...</p>
          ) : grievances.length === 0 ? (
            <div className="empty-state">
              <p>No grievances found for {selectedDept} department.</p>
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
                        {g.status !== "Resolved" ? (
                          <button
                            className="resolve-btn"
                            onClick={() => updateStatus(g._id, "Resolved")}
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <button className="resolved-btn" disabled>
                            Resolved
                          </button>
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

      <button className="logout-floating" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default AdminStaffDashboard;