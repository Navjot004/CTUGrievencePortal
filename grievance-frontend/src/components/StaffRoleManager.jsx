import React, { useEffect, useState } from "react";

function StaffRoleManager() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // all | admins | team | general
  const [sortMode, setSortMode] = useState("admins-first"); // admins-first | alpha
  
  // Current logged-in user details
  const requesterId = localStorage.getItem("grievance_id");
  const myDept = localStorage.getItem("admin_department"); // e.g. "Student Welfare"
  const isMasterAdmin = requesterId === "10001";

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin-staff/all");
      if (res.ok) {
        const data = await res.json();
        // Master Admin sees everyone. Dept Admin sees only their department staff or unassigned staff.
        // But for simplicity, let's show all, and disable actions on others.
        setStaffList(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff list");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetStaffId, action, department) => {
    setMsg("Processing...");
    
    // Validations
    if (action === "promote" && !department) {
      alert("Please select a department first.");
      setMsg("");
      return;
    }

    // 🔥 NEW: Confirmation for promotion
    if (action === "promote") {
      const confirmed = window.confirm(
        `Assign this person as Admin for ${department}?\n\nNote: If another admin exists for this department, they will be automatically removed.`
      );
      if (!confirmed) {
        setMsg("");
        return;
      }
    }

    try {
      const res = await fetch("http://localhost:5000/api/admin-staff/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId,
          targetStaffId,
          action,      // "promote" or "demote"
          department,  // Selected department
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsg(`✅ Success: ${data.message}`);
        fetchStaffList(); // Refresh list to show new roles
      } else {
        setMsg(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setMsg("❌ Network Error");
    }
  };

  // Helper to check if current user can edit target user
  const canEdit = (staff) => {
    if (isMasterAdmin) return true; // Master can edit anyone
    
    // Dept Admin can only edit:
    // 1. General Staff (Unassigned)
    // 2. Staff assigned to THEIR own department (Team Members)
    // Dept Admin CANNOT edit other Admins or staff from other depts
    if (!staff.adminDepartment) return true; 
    if (staff.adminDepartment === myDept && !staff.isDeptAdmin) return true;
    
    return false;
  };

  return (
    <div className="card" style={{ marginTop: "20px" }}>
      <h2>Manage Staff Roles</h2>
      <p style={{ color: "#64748b", marginBottom: "15px" }}>
        {isMasterAdmin 
          ? "Master Privileges: You can appoint Admins for ANY department." 
          : `Department Admin: You can add team members to ${myDept}.`}
      </p>

      {msg && <div className="alert-box info" style={{ marginBottom: "15px" }}>{msg}</div>}

      {/* Controls: Search + Filter + Sort */}
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

        <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} style={{ padding: '8px' }}>
          <option value="admins-first">Admins First</option>
          <option value="alpha">Name A → Z</option>
        </select>
      </div>

      {loading ? (
        <p>Loading staff list...</p>
      ) : (
        <div className="table-container">
          <table className="grievance-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Current Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = searchQuery.trim().toLowerCase();
                let list = staffList.slice();

                if (filterRole === 'admins') list = list.filter(s => s.isDeptAdmin);
                else if (filterRole === 'team') list = list.filter(s => s.adminDepartment && !s.isDeptAdmin);
                else if (filterRole === 'general') list = list.filter(s => !s.adminDepartment);

                if (q) {
                  list = list.filter(s => (s.fullName || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q));
                }

                if (sortMode === 'admins-first') {
                  list.sort((a, b) => {
                    if (a.isDeptAdmin && !b.isDeptAdmin) return -1;
                    if (!a.isDeptAdmin && b.isDeptAdmin) return 1;
                    const aTeam = a.adminDepartment && !a.isDeptAdmin;
                    const bTeam = b.adminDepartment && !b.isDeptAdmin;
                    if (aTeam && !bTeam) return -1;
                    if (!aTeam && bTeam) return 1;
                    return (a.fullName || '').localeCompare(b.fullName || '');
                  });
                } else if (sortMode === 'alpha') {
                  list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
                }

                return list.map((staff) => (
                  <tr key={staff.id}>
                    <td>{staff.id}</td>
                    <td>{staff.fullName}</td>

                    <td>
                      {staff.isDeptAdmin ? (
                        <span 
                          className="status-badge status-resolved" 
                          style={{ border: '1px solid #16a34a', padding: '5px 10px' }}
                        >
                          👑 Admin: {staff.adminDepartment}
                        </span>
                      ) : staff.adminDepartment ? (
                        <span 
                          className="status-badge status-assigned"
                          style={{ border: '1px solid #2563eb', padding: '5px 10px' }}
                        >
                          🛡️ Team: {staff.adminDepartment}
                        </span>
                      ) : (
                        <span className="status-badge status-pending">General Staff</span>
                      )}
                    </td>

                    <td>
                      {!canEdit(staff) ? (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          🔒 Locked
                        </span>
                      ) : (
                        <>
                          {staff.adminDepartment ? (
                            <button
                              className="action-btn"
                              style={{ backgroundColor: "#ef4444", color: "white", border: "none" }}
                              onClick={() => handleRoleChange(staff.id, "demote")}
                            >
                              {staff.isDeptAdmin ? "Remove Admin" : "Remove from Team"}
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <select
                                id={`dept-${staff.id}`}
                                className="assign-select"
                                disabled={!isMasterAdmin}
                                defaultValue={isMasterAdmin ? "" : myDept}
                              >
                                <option value="" disabled>Select Dept...</option>
                                {[
                                  "Accounts",
                                  "Student Welfare",
                                  "Student Section",
                                  "Admission",
                                  "Examination",
                                  "School of Engineering and Technology",
                                  "School of Management Studies",
                                  "School of Law",
                                  "School of Pharmaceutical Sciences",
                                  "School of Hotel Management",
                                  "School of Design and innovation",
                                  "School of Allied Health Sciences",
                                  "School of Social Sciences and Liberal Arts",
                                ].map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>

                              <button
                                className="action-btn"
                                style={{ backgroundColor: "#10b981", color: "white", border: "none" }}
                                onClick={() => {
                                  const deptSelect = document.getElementById(`dept-${staff.id}`);
                                  handleRoleChange(staff.id, "promote", deptSelect.value);
                                }}
                              >
                                {isMasterAdmin ? "Make Admin" : "Add to Team"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StaffRoleManager;