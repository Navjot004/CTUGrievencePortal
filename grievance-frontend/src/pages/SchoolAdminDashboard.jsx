import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css"; // Existing CSS for table structure
import AssignStaffPopup from "../components/AssignStaffPopup";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("grievance_id")?.toUpperCase();
  
  const mySchoolName = localStorage.getItem("admin_department"); 
  const isAuthorized = !!mySchoolName; 

  // Data States
  const [grievances, setGrievances] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  
  // ✅ FILTER STATES
  const [searchId, setSearchId] = useState(""); 
  const [searchStaffId, setSearchStaffId] = useState(""); // Search by Staff ID
  const [statusFilter, setStatusFilter] = useState("All"); 

  // Popup States
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [assignGrievanceId, setAssignGrievanceId] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  useEffect(() => {
    if (!isAuthorized) {
      navigate("/");
    } else {
      fetchMySchoolGrievances();
      fetchStaffNames(); 
    }
  }, [navigate, isAuthorized]);

  const fetchMySchoolGrievances = async () => {
    try {
      const category = encodeURIComponent(mySchoolName);
      const res = await fetch(`http://localhost:5000/api/grievances/category/${category}`);
      if (res.ok) setGrievances(await res.json());
      else console.error("Failed to fetch grievances");
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStaffNames = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin-staff/all");
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach(staff => {
          map[staff.id] = staff.fullName;
        });
        setStaffMap(map);
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/grievances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolvedBy: userId }),
      });
      fetchMySchoolGrievances(); 
    } catch (err) {
      console.error(err);
    }
  };

  const openAssignPopup = (id) => { setAssignGrievanceId(id); setIsAssignPopupOpen(true); };
  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // ✅ FILTER LOGIC
  const filteredGrievances = grievances.filter((g) => {
    const matchId = (g.userId || "").toLowerCase().includes(searchId.toLowerCase());
    const matchStaff = (g.assignedTo || "").toLowerCase().includes(searchStaffId.toLowerCase());
    const matchStatus = statusFilter === "All" || g.status === statusFilter;
    return matchId && matchStaff && matchStatus;
  });

  // ✅ INLINE STYLES FOR MODERN UI (No separate CSS needed)
  const styles = {
    filterBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#ffffff",
      padding: "15px 20px",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
      marginBottom: "25px",
      border: "1px solid #eaecf0",
      gap: "20px",
      flexWrap: "wrap",
    },
    searchGroup: {
      display: "flex",
      gap: "15px",
      flex: "2",
      minWidth: "300px",
    },
    inputWrapper: {
      position: "relative",
      flex: "1",
      display: "flex",
      alignItems: "center",
    },
    icon: {
      position: "absolute",
      left: "12px",
      fontSize: "16px",
      opacity: "0.6",
      pointerEvents: "none",
    },
    input: {
      width: "100%",
      padding: "12px 12px 12px 40px", // Left padding for icon
      border: "1px solid #d0d5dd",
      borderRadius: "8px",
      fontSize: "14px",
      backgroundColor: "#fff",
      color: "#333",
      outline: "none",
      transition: "border 0.3s ease",
    },
    selectWrapper: {
      flex: "1",
      minWidth: "150px",
    },
    select: {
      width: "100%",
      padding: "12px 16px",
      border: "1px solid #d0d5dd",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#344054",
      backgroundColor: "#f9fafb",
      cursor: "pointer",
      outline: "none",
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{mySchoolName || "School"} Dashboard</h1>
          <p>Admin: {userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>Department Issues</span></li>
          <li><Link to="/admin/manage-staff">Manage Staff</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2>Grievances Assigned to {mySchoolName}</h2>
          </div>

          {/* ✅ MODERN FILTER BAR (Inline Styles) */}
          <div style={styles.filterBar}>
            
            {/* Search Inputs */}
            <div style={styles.searchGroup}>
              {/* Student ID */}
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search Student ID..." 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  style={styles.input}
                />
              </div>

              {/* Staff ID */}
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>👨‍🏫</span>
                <input 
                  type="text" 
                  placeholder="Search Staff ID..." 
                  value={searchStaffId}
                  onChange={(e) => setSearchStaffId(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div style={styles.selectWrapper}>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">🟡 Pending</option>
                <option value="Assigned">🔵 Assigned</option>
                <option value="Resolved">🟢 Resolved</option>
              </select>
            </div>

          </div>

          {/* TABLE */}
          {filteredGrievances.length === 0 ? (
            <div className="empty-state">
              <p>{grievances.length === 0 ? "No pending issues." : "No grievances found matching filters."}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student</th>
                    <th>Assigned To</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrievances.map((g) => {
                    const staffName = staffMap[g.assignedTo];

                    return (
                      <tr key={g._id}>
                        <td style={{ fontWeight: "bold", color: "#333" }}>{g.userId}</td>
                        <td>{g.name}</td>
                        
                        <td style={{ color: g.assignedTo ? "#0056b3" : "#999" }}>
                          {g.assignedTo ? (
                            staffName ? (
                              <div>
                                <span style={{ fontWeight: "600" }}>{staffName}</span>
                                <br />
                                <span style={{ fontSize: "12px", color: "#666" }}>({g.assignedTo})</span>
                              </div>
                            ) : (
                              <span>{g.assignedTo}</span> 
                            )
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="message-cell" onClick={() => setSelectedGrievance(g)} style={{cursor:'pointer', textDecoration:'underline'}}>
                          {g.message.substring(0, 30)}...
                        </td>
                        <td>{formatDate(g.createdAt)}</td>
                        <td><span className={`status-badge status-${g.status.toLowerCase()}`}>{g.status}</span></td>
                        <td>
                          <div className="action-buttons">
                            {g.status !== "Resolved" && (
                              <>
                                <button className="action-btn assign-btn" onClick={() => openAssignPopup(g._id)}>Assign</button>
                                <button className="action-btn resolve-btn" onClick={() => updateStatus(g._id, "Resolved")}>Resolve</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selectedGrievance && (
        <div className="chat-modal-overlay" onClick={() => setSelectedGrievance(null)}>
           <div className="chat-modal" style={{height:'auto', padding:'20px'}}>
             <h3>Details</h3>
             <p>{selectedGrievance.message}</p>
             <button className="close-btn" onClick={() => setSelectedGrievance(null)}>Close</button>
           </div>
        </div>
      )}

      <AssignStaffPopup isOpen={isAssignPopupOpen} onClose={() => setIsAssignPopupOpen(false)} department={mySchoolName} grievanceId={assignGrievanceId} adminId={userId} onAssigned={(m, t) => { fetchMySchoolGrievances() }} />

    </div>
  );
}

export default SchoolAdminDashboard;