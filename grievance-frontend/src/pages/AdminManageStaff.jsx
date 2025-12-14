import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
};

function AdminManageStaff() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();

  const adminDeptMap = {
    ADM_ACCOUNT: "Accounts",
    ADM_ADMISSION: "Admission",
    ADM_WELFARE: "Student Welfare",
    ADM_EXAM: "Examination",
    ADM_DEPT: "Department", // ✅ NEW
  };

  const fixedDepartment = adminDeptMap[userId] || null;
  const [department, setDepartment] = useState(fixedDepartment || "");
  const [staffId, setStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState(""); 
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemoveId, setLoadingRemoveId] = useState(null);

  useEffect(() => {
    if (!role || role !== "admin") navigate("/");
  }, [role, navigate]);

  useEffect(() => {
    if (!department) return;
    fetchStaffList(department);
  }, [department]);

  const fetchStaffList = async (dept) => {
    try {
      setLoadingList(true);
      setMsg("");
      setStatusType("");

      const res = await fetch(`http://localhost:5000/api/admin-staff/${encodeURIComponent(dept)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load staff list");

      setStaffList(data);
    } catch (err) {
      console.error(err);
      setMsg(err.message);
      setStatusType("error");
    } finally {
      setLoadingList(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!department) {
      setMsg("Please select a department first.");
      setStatusType("error");
      return;
    }
    if (!staffId.trim()) {
      setMsg("Please enter a Staff ID.");
      setStatusType("error");
      return;
    }

    setLoadingAdd(true);
    setMsg("Adding staff...");
    setStatusType("info");

    try {
      const res = await fetch("http://localhost:5000/api/admin-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: staffId.toUpperCase().trim(), department }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add staff");

      setMsg("✅ Staff added successfully.");
      setStatusType("success");
      setStaffId("");
      fetchStaffList(department);
    } catch (err) {
      setMsg(err.message);
      setStatusType("error");
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveStaff = async (staffIdToRemove) => {
    if (!window.confirm(`Remove ${staffIdToRemove}?`)) return;
    setLoadingRemoveId(staffIdToRemove);
    try {
      const res = await fetch(`http://localhost:5000/api/admin-staff/${encodeURIComponent(department)}/${encodeURIComponent(staffIdToRemove)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove staff");
      setMsg("✅ Staff removed.");
      setStatusType("success");
      fetchStaffList(department);
    } catch (err) {
      setMsg(err.message);
      setStatusType("error");
    } finally {
      setLoadingRemoveId(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isMainAdmin = !fixedDepartment;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Manage Department Staff</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul><li className="admin-nav-title"><span>Admin Staff Configuration</span></li></ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Department Admin Staff</h2>
          <p style={{marginBottom: "1rem", color: "var(--text-light)"}}>
            {isMainAdmin ? "Select a department to manage staff." : `You are managing staff for ${fixedDepartment}.`}
          </p>

          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          <div className="form-row">
            <div className="input-group">
              <label>Department</label>
              {isMainAdmin ? (
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select Department</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Admission">Admission</option>
                  <option value="Student Welfare">Student Welfare</option>
                  <option value="Examination">Examination</option>
                  <option value="Department">Department</option> {/* ✅ NEW */}
                </select>
              ) : (
                <input type="text" value={fixedDepartment || ""} readOnly className="read-only-input" />
              )}
            </div>
          </div>

          <form onSubmit={handleAddStaff}>
            <div className="form-row">
              <div className="input-group">
                <label>Staff ID</label>
                <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value.toUpperCase())} placeholder="Enter Staff ID" />
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loadingAdd || !department}>
              {loadingAdd ? "Adding..." : "Add as Admin Staff"}
            </button>
          </form>

          <h3 style={{ marginTop: "2rem" }}>Current Admin Staff</h3>
          {loadingList ? <p>Loading...</p> : !department ? <p>Select department.</p> : staffList.length === 0 ? <p>No staff found.</p> : (
            <div className="table-container">
              <table className="grievance-table">
                <thead><tr><th>Staff ID</th><th>Dept</th><th>Action</th></tr></thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s._id || s.staffId}>
                      <td>{s.staffId}</td>
                      <td>{s.department}</td>
                      <td>{formatDate(s.createdAt)}</td>
                      <td>
                        <button type="button" className="resolved-btn" style={{backgroundColor: "#ef4444"}} onClick={() => handleRemoveStaff(s.staffId)} disabled={loadingRemoveId === s.staffId}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <button className="logout-floating" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default AdminManageStaff;