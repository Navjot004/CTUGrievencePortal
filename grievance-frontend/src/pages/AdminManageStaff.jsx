import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css"; 

const AdminManageStaff = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  
  const isMaster = userId === "10001";
  const myDepartment = localStorage.getItem("admin_department") || "";
  const isDeptAdmin = localStorage.getItem("is_dept_admin") === "true";

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // all | admins | team | general

  const allDepartments = [
    "Accounts", "Examination", "Student Welfare", "Admission", 
    "School of Engineering", "School of Management", "School of Law", 
    "Pharmaceutical Sciences", "Hotel Management", "Design & Innovation", 
    "Allied Health Sciences", "Social Sciences"
  ];

  useEffect(() => {
    // Only Admin or Dept Admin allowed
    if (role !== "admin" && !isDeptAdmin) {
      navigate("/");
      return;
    }
    fetchStaff();
  }, [role, isDeptAdmin, navigate]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // ✅ Correct URL matching your new server.js
      const res = await fetch("http://localhost:5000/api/admin-staff/all");
      const data = await res.json();
      if (res.ok) setStaffList(data);
    } catch (err) {
      setMsg("Failed to load staff list.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetStaffId, action, selectedDept = "") => {
    if (action === "promote" && !selectedDept) {
      alert("Please select a department first.");
      return;
    }
    // Dept Admin Restriction: Can only add to own dept
    if (!isMaster && action === "promote" && selectedDept !== myDepartment) {
        alert(`❌ You are only authorized to add staff to ${myDepartment}.`);
        return;
    }

    const confirmMsg = action === 'promote' 
      ? `Assign ${targetStaffId} to ${selectedDept}?` 
      : `Remove ${targetStaffId} from role?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setMsg("Updating...");
      setStatusType("info");

      const res = await fetch("http://localhost:5000/api/admin-staff/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: userId, targetStaffId, action, department: selectedDept }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setMsg(data.message);
        setStatusType("success");
        fetchStaff(); 
      } else {
        setMsg(data.message);
        setStatusType("error");
      }
    } catch (err) {
      setMsg("Server Error.");
      setStatusType("error");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // Helper to verify permissions
  const canEdit = (staff) => {
      if (isMaster) return true;
      if (staff.adminDepartment === myDepartment && !staff.isDeptAdmin) return true; // Can edit own team members
      if (!staff.adminDepartment) return true; // Can add fresh staff
      return false; // Cannot edit other admins or other dept staff
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Manage Department Staff</h1>
          <p>Logged in as: <strong>{userId}</strong> {myDepartment ? `(${myDepartment})` : ""}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      {/* Navbar logic based on role */}
      <nav className="navbar">
          <ul>
              {isMaster ? (
                  <li className="admin-nav-title"><span>Master Admin Panel</span></li>
              ) : (
                  <>
                    <li className="admin-nav-title"><span>{myDepartment} Admin</span></li>
                    {/* Add back button for Dept Admin to go to dashboard */}
                    <li><a href="#" onClick={(e) => { e.preventDefault(); navigate(-1); }} style={{cursor:'pointer'}}>⬅ Back to Dashboard</a></li>
                  </>
              )}
          </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Department Team Members</h2>
          <p style={{ color: "#64748b", marginBottom: "15px" }}>
            {isMaster 
                ? "Assign Department Admins (Bosses) and view team structures." 
                : "Add staff members to your team to help resolve grievances."}
          </p>
          
          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {/* Controls */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 10px', flex: 1 }}
            />

            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '8px' }}>
              <option value="all">All</option>
              <option value="admins">Admins (Dept Admin)</option>
              <option value="team">Admin Staff (Team Members)</option>
              <option value="general">General Staff</option>
            </select>
          </div>

          {loading ? <p>Loading...</p> : (
            <div className="table-container">
              <table className="grievance-table">
                <thead><tr><th>ID</th><th>Name</th><th>Role / Dept</th><th>Action</th></tr></thead>
                <tbody>
                  {(() => {
                    if (!staffList || staffList.length === 0) return <tr><td colSpan="4">No staff found.</td></tr>;

                    const q = searchQuery.trim().toLowerCase();
                    let list = staffList.slice();

                    if (filterRole === 'admins') {
                      list = list.filter(s => s.isDeptAdmin);
                      if (!isMaster && myDepartment) list = list.filter(s => s.adminDepartment === myDepartment);
                    } else if (filterRole === 'team') {
                      list = list.filter(s => s.adminDepartment && !s.isDeptAdmin);
                      if (!isMaster && myDepartment) list = list.filter(s => s.adminDepartment === myDepartment);
                    } else if (filterRole === 'general') {
                      list = list.filter(s => !s.adminDepartment);
                    }

                    if (q) {
                      list = list.filter(s => (s.fullName || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q));
                    }

                    return list.map((staff) => {
                      const deptOptions = isMaster ? allDepartments : (myDepartment ? [myDepartment] : []);
                      const isEditable = canEdit(staff);

                      return (
                        <tr key={staff.id} style={{ opacity: isEditable ? 1 : 0.6 }}>
                          <td>{staff.id}</td>
                          <td>{staff.fullName}</td>
                          
                          {/* ✅ HIERARCHY DISPLAY FIX */}
                          <td>
                            {staff.isDeptAdmin ? (
                              <span className="status-badge status-resolved" style={{border: '1px solid #16a34a'}}>
                                👑 Admin: {staff.adminDepartment}
                              </span>
                            ) : staff.adminDepartment ? (
                              <span className="status-badge status-assigned" style={{border: '1px solid #2563eb'}}>
                                🛡️ Team: {staff.adminDepartment}
                              </span>
                            ) : (
                              <span className="status-badge status-pending">General Staff</span>
                            )}
                          </td>

                          <td>
                            {!isEditable ? (
                                <span style={{fontSize:'0.85rem', color:'#94a3b8'}}>🔒 Locked</span>
                            ) : (
                                <>
                                    {staff.adminDepartment ? (
                                        <button 
                                            className="action-btn" 
                                            style={{ backgroundColor: "#ef4444", color: "white" }} 
                                            onClick={() => handleRoleChange(staff.id, "demote")}
                                        >
                                            {staff.isDeptAdmin ? "Remove Admin" : "Remove from Team"}
                                        </button>
                                    ) : (
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <select 
                                                id={`dept-${staff.id}`} 
                                                className="assign-select" 
                                                defaultValue={!isMaster ? myDepartment : ""}
                                                disabled={!isMaster}
                                            >
                                                <option value="" disabled>Select Dept...</option>
                                                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            
                                            <button 
                                                className="action-btn" 
                                                style={{ backgroundColor: "#10b981", color: "white" }} 
                                                onClick={() => {
                                                    const val = document.getElementById(`dept-${staff.id}`).value;
                                                    handleRoleChange(staff.id, "promote", val);
                                                }}
                                            >
                                                {isMaster ? "Make Admin" : "Add to Team"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminManageStaff;