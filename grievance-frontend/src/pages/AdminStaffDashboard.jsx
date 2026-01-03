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
  const role = localStorage.getItem("grievance_role")?.toLowerCase();
  const staffId = localStorage.getItem("grievance_id")?.toUpperCase();

  const [staffName, setStaffName] = useState("");
  const [myDepartment, setMyDepartment] = useState(""); 
  
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");

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

  // 2. Fetch Assigned Grievances
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

  // --- 3. LIVE POLLING FOR NOTIFICATIONS ONLY ---
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
              
              // If sender is NOT staff, then it's student -> UNREAD
              const isStudentSender = (lastMsg.senderRole !== "staff" && lastMsg.senderId !== staffId);

              // A. Red Dot Logic
              if (showChat && currentChatId === g._id) {
                 newUnreadMap[g._id] = false;
              } else {
                 newUnreadMap[g._id] = isStudentSender;
              }

              // B. Toast Logic
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
      
      if (newToastMsg) {
        showToastNotification(newToastMsg);
      }

      isFirstPoll.current = false;
    };

    const intervalId = setInterval(pollMessages, 5000);
    pollMessages(); // Run once immediately

    return () => clearInterval(intervalId);
  }, [grievances, staffId, showChat, currentChatId]); 

  const showToastNotification = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // --- CHAT FUNCTIONS ---
  const openChat = (grievanceId) => {
    setCurrentChatId(grievanceId);
    setShowChat(true);
    // Remove red dot immediately
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

  return (
    <div className="dashboard-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-notification">
          <span>🔔</span>
          {toast.message}
        </div>
      )}

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

                      {/* --- FIXED MESSAGE CELL (Max Width 150px + See More) --- */}
                      <td className="message-cell" style={{ maxWidth: '150px' }}>
                        {g.message.length > 20 ? (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                            <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>
                              {g.message.substring(0, 20)}...
                            </span>
                            <button 
                              onClick={() => setSelectedGrievance(g)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2563eb',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textDecoration: 'underline',
                                padding: 0,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              See more
                            </button>
                          </div>
                        ) : (
                          <span style={{ wordBreak: 'break-all' }}>{g.message}</span>
                        )}
                      </td>
                      {/* ---------------------------------------------------- */}

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

                          {/* Chat Button with Notification Wrapper */}
                          <div className="chat-btn-wrapper">
                            <button 
                                className="action-btn"
                                style={{ backgroundColor: "#2563eb", color: "white" }} 
                                onClick={() => openChat(g._id)}
                            >
                                Chat
                            </button>
                            {/* 🔴 RED DOT */}
                            {unreadMap[g._id] && (
                              <span className="notification-dot"></span>
                            )}
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

      {/* --- DETAILS POPUP MODAL (Fixed for Long Text) --- */}
      {selectedGrievance && (
        <div 
          onClick={() => setSelectedGrievance(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Grievance Details</h3>
              <button 
                onClick={() => setSelectedGrievance(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ fontSize: '0.95rem', color: '#334155' }}>
              <p style={{ marginBottom: '8px' }}><strong>Student:</strong> {selectedGrievance.name} ({selectedGrievance.regid})</p>
              <p style={{ marginBottom: '8px' }}><strong>Email:</strong> {selectedGrievance.email}</p>
              <p style={{ marginBottom: '8px' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
              
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', margin: '15px 0', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#1e293b' }}>Full Message:</strong>
                
                {/* --- FIXED: Break-all added here --- */}
                <p style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.5',
                  wordBreak: 'break-all',     
                  overflowWrap: 'anywhere' 
                }}>
                  {selectedGrievance.message}
                </p>
                {/* ----------------------------------- */}

              </div>

              <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {selectedGrievance.status}</p>
            </div>

            {/* Modal Footer */}
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button 
                onClick={() => setSelectedGrievance(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e2e8f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#475569'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------------- */}

      {/* ✅ Chat Popup (Using Reusable Component) */}
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