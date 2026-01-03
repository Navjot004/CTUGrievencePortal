import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css"; 
// ✅ Ab hum ChatPopup ko component folder se import kar rahe hain
import ChatPopup from "../components/ChatPopup"; 

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
  
  // ✅ STATE FOR POPUP
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  // State
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatGrievanceId, setChatGrievanceId] = useState(null);

  useEffect(() => {
    if (!role || role !== "student") navigate("/");
  }, [role, navigate]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. User Info
        const userRes = await fetch(`http://localhost:5000/api/auth/user/${userId}`);
        const userData = await userRes.json();
        if (userRes.ok) setStudentName(userData.fullName);

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
  }, [userId]);

  const openChat = (gId) => {
    setChatGrievanceId(gId);
    setIsChatOpen(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

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
      
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <p>Welcome back, <strong>{studentName || userId}</strong></p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>Logout</button>
      </header>

      {/* ✅ NAVBAR */}
      <nav className="navbar">
        <ul>
          <li className="active"><Link to="/student/dashboard">Dashboard</Link></li>
          <li><Link to="/student/welfare">Student Welfare</Link></li>
          <li><Link to="/student/admission">Admission</Link></li>
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
          {loading ? (
            <p>Loading records...</p>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
              <h3>No grievances found</h3>
              <p>You haven't submitted any grievances yet.</p>
              <button 
                style={{marginTop: '15px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600}} 
                onClick={() => navigate('/student/welfare')}
              >
                Submit a Grievance
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="grievance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>School</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((g) => (
                    <tr key={g._id}>
                      <td>{formatDate(g.createdAt)}</td>
                      <td>{g.category || "General"}</td>
                      <td>{g.school || "-"}</td>

                      {/* --- FIXED MESSAGE CELL (Max Width 150px) --- */}
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
                      {/* ------------------------------------------- */}

                      <td>
                        <span className={`status-badge status-${g.status.toLowerCase().replace(" ", "")}`}>
                          {g.status}
                        </span>
                      </td>
                      <td>{g.resolutionRemarks || "-"}</td>
                      <td>
                        <button
                          className="action-btn"
                          style={{ backgroundColor: "#3b82f6", color: "white" }}
                          onClick={() => openChat(g._id)}
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- POPUP MODAL (Fixed for Long Text) --- */}
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
                  <p style={{ marginBottom: '8px' }}><strong>Category:</strong> {selectedGrievance.category}</p>
                  <p style={{ marginBottom: '8px' }}><strong>Date:</strong> {formatDate(selectedGrievance.createdAt)}</p>
                  
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', margin: '15px 0', border: '1px solid #e2e8f0' }}>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#1e293b' }}>Full Message:</strong>
                    
                    {/* --- FIXED: Break-all added here --- */}
                    <p style={{ 
                      margin: 0, 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: '1.5',
                      wordBreak: 'break-all',     // Forces long strings to break
                      overflowWrap: 'anywhere' 
                    }}>
                      {selectedGrievance.message}
                    </p>
                    {/* ----------------------------------- */}

                  </div>

                  <p style={{ marginBottom: '8px' }}><strong>Status:</strong> {selectedGrievance.status}</p>
                  {selectedGrievance.resolutionRemarks && (
                     <p><strong>Remarks:</strong> {selectedGrievance.resolutionRemarks}</p>
                  )}
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
        </div>
      </main>

      {/* ✅ Chat Popup Component */}
      <ChatPopup 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        grievanceId={chatGrievanceId} 
        currentUserId={userId}
        currentUserRole="student"
      />
    </div>
  );
}

export default StudentDashboard;