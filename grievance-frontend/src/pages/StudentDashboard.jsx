import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css"; 
// ✅ ChatPopup Import
import ChatPopup from "../components/ChatPopup"; 
import ctLogo from "../assets/ct-logo.png";

// ✅ HELPER FUNCTION
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
};

function StudentDashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("grievance_id");
  const role = localStorage.getItem("grievance_role");
  
  // ✅ STATE FOR POPUP & DATA
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  
  // ✅ User Details State
  const [studentName, setStudentName] = useState("");
  const [studentDept, setStudentDept] = useState(""); // 🔥 Department State Added
  const [staffMap, setStaffMap] = useState({}); // ✅ Store Staff Names for "Assigned To"

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatGrievanceId, setChatGrievanceId] = useState(null);

  // --- NOTIFICATION STATE ---
  const [unreadMap, setUnreadMap] = useState({});
  const [toast, setToast] = useState({ show: false, message: "" });
  const lastMessageRef = useRef({}); 
  const isFirstPoll = useRef(true); 

  // ✅ FILTER STATES
  const [searchStaffId, setSearchStaffId] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    if (!role || role !== "student") navigate("/");
  }, [role, navigate]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. User Info Fetch
        const userRes = await fetch(`http://localhost:5000/api/auth/user/${userId}`);
        const userData = await userRes.json();
        
        if (userRes.ok) {
            setStudentName(userData.fullName);
            // ✅ Ab server se 'department' sahi aa raha hai
            setStudentDept(userData.department); 
        }

        // 2. Grievance History
        const histRes = await fetch(`http://localhost:5000/api/grievances/user/${userId}`);
        const histData = await histRes.json();

        if (histRes.ok) {
          setHistory(histData);
          
          // Stats Calculation
          const total = histData.length;
          const resolved = histData.filter(g => g.status === "Resolved").length;
          const rejected = histData.filter(g => g.status === "Rejected").length;
          const pending = total - resolved - rejected;
          
          setStats({ total, resolved, rejected, pending });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
    fetchStaffNames(); // ✅ Fetch staff list
  }, [userId]);

  // ✅ Fetch Staff List to Map IDs to Names
  const fetchStaffNames = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin-staff/all");
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach((staff) => { map[staff.id] = staff.fullName; });
        setStaffMap(map);
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  };

  // --- LIVE POLLING FOR NOTIFICATIONS ---
  useEffect(() => {
    if (!userId || history.length === 0) return;

    const pollMessages = async () => {
      const newUnreadMap = { ...unreadMap };
      let newToastMsg = null;

      await Promise.all(history.map(async (g) => {
        try {
          const res = await fetch(`http://localhost:5000/api/chat/${g._id}`);
          if (res.ok) {
            const msgs = await res.json();
            
            if (msgs.length > 0) {
              const lastMsg = msgs[msgs.length - 1];
              
              // If sender is NOT student (so it is staff/admin), then it's unread for student
              const isStaffSender = (lastMsg.senderRole !== "student" && lastMsg.senderId !== userId);

              // A. Red Dot Logic
              if (isChatOpen && chatGrievanceId === g._id) {
                 newUnreadMap[g._id] = false;
              } else {
                 newUnreadMap[g._id] = isStaffSender;
              }

              // B. Toast Logic
              if (lastMessageRef.current[g._id] !== lastMsg._id) {
                if (!isFirstPoll.current && isStaffSender) {
                   newToastMsg = `New message on grievance regarding ${g.category}`;
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
  }, [history, userId, isChatOpen, chatGrievanceId]); 

  const showToastNotification = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const openChat = (gId) => {
    setChatGrievanceId(gId);
    setIsChatOpen(true);
    // Remove red dot immediately
    setUnreadMap(prev => ({ ...prev, [gId]: false }));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ✅ FILTER LOGIC
  const filteredHistory = history.filter((g) => {
    const matchStaff = (g.assignedTo || "").toLowerCase().includes(searchStaffId.toLowerCase());
    const matchStatus = filterStatus === "All" || g.status === filterStatus;
    const matchDept = filterDepartment === "All" || (g.category || g.school || "") === filterDepartment;

    let matchMonth = true;
    if (filterMonth) {
      const gDate = new Date(g.createdAt);
      const [year, month] = filterMonth.split("-");
      matchMonth = gDate.getFullYear() === parseInt(year) && (gDate.getMonth() + 1) === parseInt(month);
    }

    return matchStaff && matchStatus && matchDept && matchMonth;
  });

  // ✅ Unique Departments for Dropdown
  const uniqueDepartments = [...new Set(history.map(g => g.category || g.school).filter(Boolean))];

  // Graph Percentages
  const totalG = stats.total || 1; 
  const resolvedPct = (stats.resolved / totalG) * 100;
  const pendingPct = (stats.pending / totalG) * 100;
  const rejectedPct = (stats.rejected / totalG) * 100;

  // Inline Styles for Graph (Clean & Professional)
  const graphStyles = {
    statsContainer: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px', width: '100%'
    },
    statCard: {
      background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    statIcon: {
      width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
    },
    graphSection: {
        background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px', width: '100%', boxSizing: 'border-box'
    },
    barGroup: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
    barTrack: { flex: 1, height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' },
    barLabel: { width: '100px', fontWeight: '500', color: '#64748b', fontSize: '0.9rem' }
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
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <img src={ctLogo} alt="CT University" style={{ height: "50px" }} />
          <div className="header-content">
            <h1>Student Dashboard</h1>
            <p>
                Welcome back, <strong>{studentName || userId}</strong>
                {/* ✅ Department Badge added here */}
                {studentDept && (
                    <span className="status-badge status-assigned" style={{marginLeft: '10px', fontSize: '0.8rem'}}>
                      🎓 {studentDept}
                    </span>
                )}
            </p>
          </div>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      {/* ✅ NAVBAR */}
      <nav className="navbar">
        <ul>
          <li className="active"><Link to="/student/dashboard">Dashboard</Link></li>
          <li><Link to="/student/welfare">Student Welfare</Link></li>
          <li><Link to="/student/admission">Admission</Link></li>
          <li><Link to="/student/section">Student Section</Link></li>
          <li><Link to="/student/accounts">Accounts</Link></li>
          <li><Link to="/student/examination">Examination</Link></li>
          <li><Link to="/student/department">Department</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        
        {/* ✅ 1. STATS OVERVIEW CARDS */}
        <div style={graphStyles.statsContainer}>
          <div style={graphStyles.statCard}>
            <div>
              <h3 style={{margin: 0, fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase'}}>Total Grievances</h3>
              <p style={{margin: '5px 0 0', fontSize: '2rem', fontWeight: 700, color: '#1e293b'}}>{stats.total}</p>
            </div>
            <div style={{...graphStyles.statIcon, background: '#eff6ff', color: '#2563eb'}}>📊</div>
          </div>
          
          <div style={graphStyles.statCard}>
            <div>
              <h3 style={{margin: 0, fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase'}}>Pending</h3>
              <p style={{margin: '5px 0 0', fontSize: '2rem', fontWeight: 700, color: '#1e293b'}}>{stats.pending}</p>
            </div>
            <div style={{...graphStyles.statIcon, background: '#fff7ed', color: '#ea580c'}}>⏳</div>
          </div>
          
          <div style={graphStyles.statCard}>
            <div>
              <h3 style={{margin: 0, fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase'}}>Resolved</h3>
              <p style={{margin: '5px 0 0', fontSize: '2rem', fontWeight: 700, color: '#1e293b'}}>{stats.resolved}</p>
            </div>
            <div style={{...graphStyles.statIcon, background: '#f0fdf4', color: '#16a34a'}}>✅</div>
          </div>
        </div>

        {/* ✅ 2. GRAPH / VISUAL REPRESENTATION */}
        {stats.total > 0 && (
          <div style={graphStyles.graphSection}>
            <h2 style={{margin: '0 0 20px', fontSize: '1.2rem', color: '#1e293b'}}>Resolution Status</h2>
            
            {/* Resolved Bar */}
            <div style={graphStyles.barGroup}>
              <span style={graphStyles.barLabel}>Resolved</span>
              <div style={graphStyles.barTrack}>
                <div style={{height: '100%', width: `${resolvedPct}%`, background: '#10b981', borderRadius: '6px', transition: 'width 0.5s'}}></div>
              </div>
              <span style={{fontWeight: 600, color: '#334155', width: '40px', textAlign: 'right'}}>{stats.resolved}</span>
            </div>

            {/* Pending Bar */}
            <div style={graphStyles.barGroup}>
              <span style={graphStyles.barLabel}>Pending</span>
              <div style={graphStyles.barTrack}>
                <div style={{height: '100%', width: `${pendingPct}%`, background: '#f59e0b', borderRadius: '6px', transition: 'width 0.5s'}}></div>
              </div>
              <span style={{fontWeight: 600, color: '#334155', width: '40px', textAlign: 'right'}}>{stats.pending}</span>
            </div>

            {/* Rejected Bar */}
            <div style={graphStyles.barGroup}>
              <span style={graphStyles.barLabel}>Rejected</span>
              <div style={graphStyles.barTrack}>
                <div style={{height: '100%', width: `${rejectedPct}%`, background: '#ef4444', borderRadius: '6px', transition: 'width 0.5s'}}></div>
              </div>
              <span style={{fontWeight: 600, color: '#334155', width: '40px', textAlign: 'right'}}>{stats.rejected}</span>
            </div>
          </div>
        )}

        {/* ✅ 3. RECENT ACTIVITY TABLE */}
        <div className="card">
          <h2>Recent Activity</h2>

          {/* ✅ FILTER BAR */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px", 
            padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0"
          }}>
            <input 
              type="text" placeholder="Search Staff ID..." 
              value={searchStaffId} onChange={(e) => setSearchStaffId(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", flex: "1 1 150px" }}
            />
            <select 
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", flex: "1 1 120px", cursor: "pointer" }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select 
              value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", flex: "1 1 150px", cursor: "pointer" }}
            >
              <option value="All">All Departments</option>
              {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            <input 
              type="month" 
              value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", flex: "1 1 150px", cursor: "pointer" }}
            />
            <button 
              onClick={() => {
                setSearchStaffId(""); setFilterStatus("All"); setFilterDepartment("All"); setFilterMonth("");
              }}
              style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "#64748b", color: "white", cursor: "pointer", fontWeight: "600" }}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <p>Loading records...</p>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
              <h3>No grievances found</h3>
              <p>{history.length === 0 ? "You haven't submitted any grievances yet." : "No grievances match your filters."}</p>
              {history.length === 0 && (
                <button 
                style={{marginTop: '15px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600}} 
                onClick={() => navigate('/student/welfare')}
              >
                Submit a Grievance
              </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category / School</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((g) => (
                    <tr key={g._id}>
                      <td>{formatDate(g.createdAt)}</td>
                      <td>{g.category || "General"}</td>

                      {/* --- FIXED MESSAGE CELL (Max Width 150px) --- */}
                      <td className="message-cell" style={{ maxWidth: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
                          <span style={{ wordBreak: 'break-all', lineHeight: '1.2' }}>
                            {g.message.substring(0, 20)}{g.message.length > 20 ? "..." : ""}
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
                      </td>
                      {/* ------------------------------------------- */}

                      <td>
                        <span className={`status-badge status-${g.status.toLowerCase().replace(" ", "")}`}>
                          {g.status}
                        </span>
                      </td>
                      
                      {/* ✅ ASSIGNED TO COLUMN */}
                      <td>
                        {g.assignedTo ? (
                          <span style={{ fontWeight: "500", color: "#1e293b" }}>
                            {staffMap[g.assignedTo] || "Staff"} <span style={{fontSize:'0.85rem', color:'#64748b'}}>({g.assignedTo})</span>
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Yet to assign</span>
                        )}
                      </td>

                      <td>
                        <div className="chat-btn-wrapper">
                          <button
                            className="action-btn"
                            style={{ backgroundColor: "#3b82f6", color: "white" }}
                            onClick={() => openChat(g._id)}
                          >
                            Chat
                          </button>
                          {/* 🔴 RED DOT */}
                          {unreadMap[g._id] && (
                            <span className="notification-dot"></span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* --- DETAILS POPUP MODAL --- */}
        {selectedGrievance && (
            <div 
              onClick={() => setSelectedGrievance(null)}
              style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                justifyContent: 'center', alignItems: 'center', zIndex: 1000
              }}
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '85vh'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Grievance Details</h3>
                  <button onClick={() => setSelectedGrievance(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>
                
                <div style={{ overflowY: 'auto', paddingRight: '5px' }}>
                  <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Category:</strong> {selectedGrievance.category || selectedGrievance.school || "General"}</p>
                  <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
                  <p style={{ marginBottom: '10px', color: '#475569' }}><strong>Status:</strong> <span className={`status-badge status-${selectedGrievance.status.toLowerCase()}`}>{selectedGrievance.status}</span></p>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px', color: '#334155' }}>Full Message:</strong>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#1e293b', wordBreak: 'break-word' }}>
                      {selectedGrievance.message}
                    </p>
                  </div>

                  {/* ✅ ATTACHMENT BUTTON */}
                  {selectedGrievance.attachment && (
                    <div style={{ marginTop: '15px' }}>
                      <strong>Attachment: </strong>
                      <a 
                        href={`http://localhost:5000/api/file/${selectedGrievance.attachment}`} 
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}
                      >
                        View Document 📎
                      </a>
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: 'right', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <button 
                    onClick={() => setSelectedGrievance(null)}
                    style={{
                      padding: '10px 20px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px',
                      cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#cbd5e1'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
        )}

      </main>

      {/* ✅ Chat Popup Component */}
      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        grievanceId={chatGrievanceId} 
        currentUserId={userId}
        currentUserRole="student"
      />

      {/* ✅ SUPER SMOOTH INTERACTIONS (Makhan UI) */}
      <style>{`
        .dashboard-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* Smooth Transitions */
        .card, .navbar, input, select, textarea, button, .action-btn, .submit-btn, .logout-btn-header {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }

        /* Hover Effects */
        .card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
        
        button:hover, .action-btn:hover, .submit-btn:hover, .logout-btn-header:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        button:active, .action-btn:active { transform: scale(0.95); }

        /* Inputs */
        input:focus, select:focus, textarea:focus {
          transform: scale(1.01);
          border-color: #2563eb !important;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
        }

        /* Table */
        tr { transition: background-color 0.2s ease; }
        tr:hover { background-color: #f8fafc !important; }
      `}</style>
    </div>
  );
}

export default StudentDashboard;