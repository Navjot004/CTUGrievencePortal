import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

// Internal styles for Notification Dot & Toast
const internalStyles = `
  .chat-btn-wrapper {
    position: relative;
    display: inline-block;
  }
  .notification-dot {
    height: 10px;
    width: 10px;
    background-color: #ef4444;
    border-radius: 50%;
    display: inline-block;
    position: absolute;
    top: -3px;
    right: -3px;
    border: 1px solid white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }
  .toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #1e293b; /* Dark Slate */
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    border-left: 4px solid #3b82f6; /* Blue Accent */
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;

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
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- NEW: NOTIFICATION STATE ---
  const [unreadMap, setUnreadMap] = useState({}); // Stores which grievance has unread msgs
  const [toast, setToast] = useState({ show: false, message: "" });
  const lastMessageRef = useRef({}); // To track message IDs and detect NEW ones
  const isFirstPoll = useRef(true); // To prevent toast spam on page load
  // ------------------

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

        // Get Assigned Admin Department
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

  // --- 3. NEW: LIVE POLLING FOR MESSAGES & NOTIFICATIONS ---
  useEffect(() => {
    if (!staffId || grievances.length === 0) return;

    const pollMessages = async () => {
      const newUnreadMap = { ...unreadMap };
      let newToastMsg = null;

      // Check messages for ALL assigned grievances
      await Promise.all(grievances.map(async (g) => {
        try {
          const res = await fetch(`http://localhost:5000/api/chat/${g._id}`);
          if (res.ok) {
            const msgs = await res.json();
            
            if (msgs.length > 0) {
              const lastMsg = msgs[msgs.length - 1];
              
              // Determine if sender is Student (Logic: if senderRole is NOT staff)
              const isStudentSender = (lastMsg.senderRole !== "staff" && lastMsg.sender !== "staff");

              // A. Red Dot Logic: If last message is from student, show dot
              newUnreadMap[g._id] = isStudentSender;

              // B. Toast Logic: If it's a NEW message ID we haven't seen in this session
              if (lastMessageRef.current[g._id] !== lastMsg._id) {
                // Only show toast if it's NOT the first load AND it's from a student
                if (!isFirstPoll.current && isStudentSender) {
                   newToastMsg = `New message from ${g.name}`;
                }
                // Update Ref
                lastMessageRef.current[g._id] = lastMsg._id;
              }

              // C. Live Chat Update: If this grievance chat is currently OPEN
              if (showChat && currentChatId === g._id) {
                setChatMessages((prev) => {
                  // Only update if message count changed (simple check)
                  if (prev.length !== msgs.length) return msgs;
                  return prev;
                });
              }
            }
          }
        } catch (err) {
          // Silent fail for polling
          console.warn("Polling error for", g._id);
        }
      }));

      setUnreadMap(newUnreadMap);
      
      if (newToastMsg) {
        showToastNotification(newToastMsg);
      }

      isFirstPoll.current = false; // First load done
    };

    // Poll every 5 seconds
    const intervalId = setInterval(pollMessages, 5000);
    
    // Also run once immediately to populate dots
    pollMessages();

    return () => clearInterval(intervalId);
  }, [grievances, staffId, showChat, currentChatId]); // Re-run if grievance list changes

  const showToastNotification = (message) => {
    setToast({ show: true, message });
    // Hide after 3 seconds
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // --- CHAT FUNCTIONS ---
  const openChat = async (grievanceId) => {
    setCurrentChatId(grievanceId);
    setShowChat(true);
    setChatMessages([]); // Reset old messages
    
    // Fetch chat history immediately
    try {
      const res = await fetch(`http://localhost:5000/api/chat/${grievanceId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
        // Mark as read immediately in local state (remove dot)
        setUnreadMap(prev => ({ ...prev, [grievanceId]: false }));
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  const closeChat = () => {
    setShowChat(false);
    setCurrentChatId(null);
    setChatMessages([]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);

    try {
      const payload = {
        grievanceId: currentChatId,
        senderId: staffId,
        message: newMessage,
        senderRole: "staff", 
        sender: staffName || "Staff"
      };

      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setChatMessages([...chatMessages, savedMsg]);
        setNewMessage("");
        
        // Ensure dot is gone since we replied (sender is now staff)
        setUnreadMap(prev => ({ ...prev, [currentChatId]: false }));
      } else {
        const errorData = await res.json();
        alert(`Failed to send: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Network error. Could not send message.");
    } finally {
      setIsSending(false);
    }
  };
  // ----------------------

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

      // Update list locally
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
      {/* Inject Internal Styles */}
      <style>{internalStyles}</style>

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

      {/* --- CHAT MODAL UI --- */}
      {showChat && (
        <div className="chat-modal-overlay" onClick={closeChat}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <h3>Chat with Student</h3>
              <button className="close-btn" onClick={closeChat}>&times;</button>
            </div>

            <div className="chat-body">
              {chatMessages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((m, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      // Check both senderRole and sender for compatibility
                      (m.senderRole === "staff" || m.sender === "staff") ? "sent" : "received"
                    }`}
                  >
                    <div className="msg-bubble">
                      <span className="msg-sender">
                        {(m.senderRole === "staff" || m.sender === "staff") ? "You" : "Student"}
                      </span>
                      {m.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="chat-footer">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isSending}
              />
              <button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                style={{ 
                  opacity: (!newMessage.trim() || isSending) ? 0.6 : 1,
                  cursor: (!newMessage.trim() || isSending) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------- */}
    </div>
  );
}

export default AdminStaffDashboard;