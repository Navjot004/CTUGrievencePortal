import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
};

function AdminManageStaff() {
  const navigate = useNavigate();

  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();

  // ✅ Updated Map: Maps Admin ID to Department Name directly
  const adminDeptMap = {
    // Core Departments
    ADM_ACCOUNT: "Accounts",
    ADM_ADMISSION: "Admission",
    ADM_WELFARE: "Student Welfare",
    ADM_EXAM: "Examination",
    
    // School Departments
    ADM_ENG: "School of Engineering",
    ADM_MGMT: "School of Management",
    ADM_HOTEL: "Hotel Management",
    ADM_LAW: "School of Law",
    ADM_PHARMA: "Pharmaceutical Sciences",
    ADM_DESIGN: "Design & Innovation",
    ADM_HEALTH: "Allied Health Sciences",
    ADM_SOCIAL: "Social Sciences",
  };

  // Check if current user is a specific department admin
  const fixedDepartment = adminDeptMap[userId] || null;

  // If fixedDepartment exists, use it. Otherwise empty (for Main Admin to select)
  const [department, setDepartment] = useState(fixedDepartment || "");
  const [staffId, setStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);

  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState(""); 
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemoveId, setLoadingRemoveId] = useState(null);

  // Check role
  useEffect(() => {
    if (!role || role !== "admin") {
      navigate("/");
    }
  }, [role, navigate]);

  // Load list whenever department is set (auto or manual)
  useEffect(() => {
    if (!department) return;
    fetchStaffList(department);
  }, [department]);

  const fetchStaffList = async (dept) => {
    try {
      setLoadingList(true);
      setMsg("");
      setStatusType("");

      const res = await fetch(
        `http://localhost:5000/api/admin-staff/${encodeURIComponent(dept)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load staff list");

      setStaffList(data);
    } catch (err) {
      console.error("Error fetching admin staff:", err);
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
        body: JSON.stringify({
          staffId: staffId.toUpperCase().trim(),
          department,
        }),
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
    if (!window.confirm(`Remove ${staffIdToRemove}?`)) {
      return;
    }

    setLoadingRemoveId(staffIdToRemove);
    setMsg("");
    setStatusType("");

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin-staff/${encodeURIComponent(department)}/${encodeURIComponent(staffIdToRemove)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove staff");

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

  // Logic: Only show dropdown if user is NOT a fixed department admin (i.e. Main Admin)
  const isMainAdmin = !fixedDepartment;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Manage Department Staff</h1>
          <p>Welcome, {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title">
            <span>Admin Staff Configuration</span>
          </li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Department Admin Staff</h2>

          <p style={{ marginBottom: "1rem", color: "var(--text-light)" }}>
            {isMainAdmin ? (
              <>
                Select a department to add staff members who can handle grievances.
              </>
            ) : (
              <>
                You are managing staff for <strong>{fixedDepartment}</strong>.
              </>
            )}
          </p>

          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {/* Department Selection (Only for Main Admin) */}
          <div className="form-row">
            <div className="input-group">
              <label>Department</label>
              {isMainAdmin ? (
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department</option>
                  
                  <optgroup label="Core Departments">
                    <option value="Accounts">Accounts</option>
                    <option value="Admission">Admission</option>
                    <option value="Student Welfare">Student Welfare</option>
                    <option value="Examination">Examination</option>
                  </optgroup>

                  <optgroup label="Academic Schools">
                    <option value="School of Engineering">School of Engineering</option>
                    <option value="School of Management">School of Management</option>
                    <option value="School of Law">School of Law</option>
                    <option value="Pharmaceutical Sciences">Pharmaceutical Sciences</option>
                    <option value="Hotel Management">Hotel Management</option>
                    <option value="Design & Innovation">Design & Innovation</option>
                    <option value="Allied Health Sciences">Allied Health Sciences</option>
                    <option value="Social Sciences">Social Sciences</option>
                  </optgroup>
                </select>
              ) : (
                <input
                  type="text"
                  value={fixedDepartment}
                  readOnly
                  className="read-only-input"
                />
              )}
            </div>
          </div>

          <form onSubmit={handleAddStaff}>
            <div className="form-row">
              <div className="input-group">
                <label>Staff ID (e.g. STF001)</label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                  placeholder="Enter Staff ID"
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loadingAdd || !department}
            >
              {loadingAdd ? "Adding..." : "Add Staff"}
            </button>
          </form>

          <h3 style={{ marginTop: "2rem", marginBottom: "0.75rem" }}>
            Current Staff List
          </h3>

          {loadingList ? (
            <p>Loading staff list...</p>
          ) : !department ? (
            <p style={{ color: "var(--text-light)" }}>
              Please select a department to view staff.
            </p>
          ) : staffList.length === 0 ? (
            <div className="empty-state">
              <p>No staff added yet for {department}.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Department</th>
                    <th>Added On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s._id || s.staffId}>
                      <td>{s.staffId}</td>
                      <td>{s.department}</td>
                      <td>{formatDate(s.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="resolved-btn" // Using resolved-btn style for clean look, override color
                          style={{
                            backgroundColor: "#ef4444",
                            cursor: "pointer",
                            color: "white",
                            border: "none"
                          }}
                          onClick={() => handleRemoveStaff(s.staffId)}
                          disabled={loadingRemoveId === s.staffId}
                        >
                          {loadingRemoveId === s.staffId
                            ? "Removing..."
                            : "Remove"}
                        </button>
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

export default AdminManageStaff;