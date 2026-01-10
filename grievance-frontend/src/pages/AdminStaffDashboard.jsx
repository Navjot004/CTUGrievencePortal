import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
// ✅ IMPORT CHAT COMPONENT
import ChatPopup from "../components/ChatPopup";

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
  
  // ✅ Get Details from LocalStorage
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const staffId = localStorage.getItem("grievance_id")?.toUpperCase();
  const myDepartment = localStorage.getItem("admin_department"); 
  const isDeptAdmin = localStorage.getItem("is_dept_admin") === "true";

  const [staffName, setStaffName] = useState("");
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");

  // ✅ SEARCH STATES (New)
  const [searchId, setSearchId] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  // --- CHAT STATE ---
  const [showChat, setShowChat] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  // --- NOTIFICATION STATE ---
  const [unreadMap, setUnreadMap] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const lastMessageRef = useRef({}); 
  const isFirstPoll = useRef(true); 

  // ✅ State for "See More" Details Popup
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  // 1. Authorization Check
  useEffect(() => {
    if (!role || role !== "staff") {
      navigate("/");
      return;
    }
    if (!myDepartment) {
        navigate("/staff/general");
        return;
    }
  }, [role, myDepartment, navigate]);

  // 2. Fetch User Name
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const userRes = await fetch(`http://localhost:5000/api/auth/user/${staffId}`);
        const userData = await userRes.json();
        if (userRes.ok) setStaffName(userData.fullName || staffId);
      } catch (err) {
        console.error("Error fetching staff info:", err);
      }
    };
    if (staffId) fetchStaffInfo();
  }, [staffId]);

  // 3. Fetch Assigned Grievances
  useEffect(() => {
    if (!staffId) return;

    const fetchMyAssignedGrievances = async () => {
      setLoading(true);
      setMsg("");
      try {
        const res = await fetch(`http://localhost:5000/api/grievances/assigned/${staffId}`);
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

  // --- 4. LIVE POLLING FOR NOTIFICATIONS ONLY ---
  useEffect(() => {
    if (!staffId || grievances.length === 0) return;

    const pollMessages = async () => {
      const newUnreadMap = { ...unreadMap };
      let newToastMsg = null;

      await Promise.all(grievances.map(async (g) => {
        try {
          const res = await fetch(`http://localhost:5000/api/chat/${g._id}`);
          if (res.ok) {
            const msgs = await res.json();
            if (msgs.length > 0) {
              const lastMsg = msgs[msgs.length - 1];
              const isStudentSender = (lastMsg.senderRole !== "staff" && lastMsg.senderId !== staffId);

              if (showChat && currentChatId === g._id) {
                 newUnreadMap[g._id] = false;
              } else {
                 newUnreadMap[g._id] = isStudentSender;
              }

              if (lastMessageRef.current[g._id] !== lastMsg._id) {
                if (!isFirstPoll.current && isStudentSender) {
                   newToastMsg = `New message from ${g.name}`;
                }
                lastMessageRef.current[g._id] = lastMsg._id;
              }
            }
          }
        } catch (err) {
          console.warn("Polling error for", g._id);
        }
      }));

      setUnreadMap(newUnreadMap);
      if (newToastMsg) showToastNotification(newToastMsg);
      isFirstPoll.current = false;
    };

    const intervalId = setInterval(pollMessages, 5000);
    pollMessages(); 
    return () => clearInterval(intervalId);
  }, [grievances, staffId, showChat, currentChatId]); 

  const showToastNotification = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const openChat = (grievanceId) => {
    setCurrentChatId(grievanceId);
    setShowChat(true);
    setUnreadMap(prev => ({ ...prev, [grievanceId]: false }));
  };

  const closeChat = () => {
    setShowChat(false);
    setCurrentChatId(null);
  };

  const updateStatus = async (id, newStatus) => {
    setMsg("Updating status...");
    setStatusType("info");
    try {
      const res = await fetch(`http://localhost:5000/api/grievances/update/${id}`, {
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

  // ✅ FILTER LOGIC
  const filteredGrievances = grievances.filter((g) => {
    const matchId = (g.regid || "").toLowerCase().includes(searchId.toLowerCase());
    const matchMsg = (g.message || "").toLowerCase().includes(searchMessage.toLowerCase());
    return matchId && matchMsg;
  });

  // ✅ INLINE STYLES FOR SEARCH BAR
  const styles = {
    filterBar: {
      display: "flex",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },
    inputWrapper: {
      position: "relative",
      flex: "1",
      minWidth: "250px",
    },
    icon: {
      position: "absolute",
      left: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "16px",
      color: "#888",
    },
    input: {
      width: "100%",
      padding: "12px 12px 12px 40px", // space for icon
      border: "1px solid #d0d5dd",
      borderRadius: "8px",
      fontSize: "14px",
      outline: "none",
    }
  };

  return (
    <div className="dashboard-container">
      {toast.show && (
        <div className="toast-notification">
          <span>🔔</span> {toast.message}
        </div>
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Staff Dashboard</h1>
          <p>
            Welcome, {staffName || staffId} 
            <span className="status-badge status-assigned" style={{marginLeft: '10px', fontSize: '0.8rem'}}>
              🛡️ Team: {myDepartment}
            </span>
          </p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      <nav className="navbar">
        <ul>
          <li className="admin-nav-title"><span>My Assigned Tasks</span></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Assigned Grievances</h2>
          <p style={{ marginBottom: "1rem", color: "#64748b" }}>
            These grievances have been specifically assigned to you by your Department Admin.
          </p>

          {/* ✅ NEW SEARCH BAR */}
          <div style={styles.filterBar}>
            {/* Student ID Search */}
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

            {/* Message Content Search */}
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>💬</span>
              <input 
                type="text" 
                placeholder="Search Message Content..." 
                value={searchMessage}
                onChange={(e) => setSearchMessage(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>
          {/* ------------------- */}

          {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

          {loading ? (
            <p>Loading grievances...</p>
          ) : filteredGrievances.length === 0 ? (
            <div className="empty-state">
              <p>{grievances.length === 0 ? "No grievances currently assigned to you." : "No grievances found matching your search."}</p>
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
                  {filteredGrievances.map((g) => (
                    <tr key={g._id}>
                      <td>{g.name}</td>
                      <td>{g.email}</td>
                      <td>{g.regid || "-"}</td>

                      <td className="message-cell" style={{ maxWidth: '150px' }}>
                        {g.message.length > 20 ? (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                            <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>
                              {g.message.substring(0, 20)}...
                            </span>
                            <button 
                              onClick={() => setSelectedGrievance(g)}
                              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', textDecoration: 'underline', padding: 0 }}
                            >
                              See more
                            </button>
                          </div>
                        ) : (
                          <span style={{ wordBreak: 'break-all' }}>{g.message}</span>
                        )}
                      </td>

                      <td>{formatDate(g.createdAt)}</td>
                      <td>
                        <span className={`status-badge status-${g.status.toLowerCase().replace(" ", "")}`}>
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {g.status !== "Resolved" ? (
                              <button className="action-btn resolve-btn" onClick={() => updateStatus(g._id, "Resolved")}>Mark Resolved</button>
                          ) : (
                            <span className="done-btn">Resolved</span>
                          )}

                          <div className="chat-btn-wrapper">
                            <button className="action-btn" style={{ backgroundColor: "#2563eb", color: "white" }} onClick={() => openChat(g._id)}>Chat</button>
                            {unreadMap[g._id] && <span className="notification-dot"></span>}
                          </div>
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

      {/* --- DETAILS POPUP MODAL --- */}
      {selectedGrievance && (
        <div 
          onClick={() => setSelectedGrievance(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Grievance Details</h3>
              <button onClick={() => setSelectedGrievance(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            
            <div style={{ fontSize: '0.95rem', color: '#334155' }}>
              <p style={{ marginBottom: '8px' }}><strong>Student:</strong> {selectedGrievance.name} ({selectedGrievance.regid})</p>
              <p style={{ marginBottom: '8px' }}><strong>Email:</strong> {selectedGrievance.email}</p>
              <p style={{ marginBottom: '8px' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', margin: '15px 0', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#1e293b' }}>Full Message:</strong>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{selectedGrievance.message}</p>
              </div>

              <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {selectedGrievance.status}</p>
            </div>

            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button onClick={() => setSelectedGrievance(null)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Chat Popup */}
      <ChatPopup 
        isOpen={showChat} 
        onClose={closeChat} 
        grievanceId={currentChatId} 
        currentUserId={staffId}
        currentUserRole="staff"
      />
    </div>
  );
}

export default AdminStaffDashboard;