import React, { useState, useEffect, useRef } from "react";
import "../styles/Dashboard.css"; // Ensure this has basic modal styles

function ChatPopup({ isOpen, onClose, grievanceId, currentUserId, currentUserRole }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // ✅ NEW: Track selected file
  const [isUploading, setIsUploading] = useState(false);  // ✅ NEW: Loading state for upload
  const [grievanceData, setGrievanceData] = useState(null); // ✅ Store grievance details
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // ✅ NEW: Ref for hidden file input

  // Poll for messages every 3 seconds
  useEffect(() => {
    if (!isOpen || !grievanceId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/${grievanceId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Error fetching chat:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [isOpen, grievanceId]);

  // ✅ Fetch grievance details (name, message) for header
  useEffect(() => {
    if (!isOpen || !grievanceId) return;

    const fetchGrievanceDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/grievances/detail/${grievanceId}`);
        if (res.ok) {
          const data = await res.json();
          setGrievanceData(data);
        }
      } catch (err) {
        console.error("Error fetching grievance details:", err);
      }
    };

    fetchGrievanceDetails();
  }, [isOpen, grievanceId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedFile]); // Also scroll when file is selected

  // ✅ Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setIsUploading(true);

    try {
      let uploadedFileData = null;

      // ✅ Step 1: Upload File if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("File upload failed");
        uploadedFileData = await uploadRes.json(); // Returns filename, fileId, contentType...
      }

      // ✅ Step 2: Send Message with File Data
      const payload = {
        grievanceId,
        senderId: currentUserId,
        senderRole: currentUserRole,
        sender: currentUserRole === "student" ? "Student" : "Staff", // Fallback name
        message: newMessage,
        fileData: uploadedFileData // Pass file metadata if exists
      };

      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages([...messages, sentMsg]);
        setNewMessage("");
        setSelectedFile(null); // Reset file
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <div>
            {currentUserRole === "student" ? (
              <>
                <h3 style={{ margin: '0 0 5px 0' }}>
                  {grievanceData?.assignedStaff?.name || 'Support Team'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: '1.3' }}>
                  {grievanceData?.assignedStaff ? `📋 ${grievanceData.assignedStaff.department}` : 'Awaiting assignment...'}
                </p>
              </>
            ) : (
              <>
                <h3 style={{ margin: '0 0 5px 0' }}>
                  {grievanceData?.name || 'Chat'}
                </h3>
              </>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="chat-body">
          {messages.length === 0 ? (
            <p className="no-msg">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg._id} 
                className={`chat-message ${msg.senderId === currentUserId ? "sent" : "received"}`}
              >
                <div className="msg-bubble">
                  <small className="msg-sender">{msg.senderRole === currentUserRole ? "You" : msg.senderId}</small>
                  
                  {/* ✅ DISPLAY TEXT */}
                  {msg.message && <p>{msg.message}</p>}

                  {/* ✅ DISPLAY FILE (Image or Download Link) */}
                  {msg.fileData && (
                    <div className="file-attachment" style={{marginTop: '5px'}}>
                      {msg.fileData.contentType.startsWith("image/") ? (
                        <img 
                          src={`http://localhost:5000/api/file/${msg.fileData.filename}`} 
                          alt="attachment" 
                          style={{maxWidth: "100%", borderRadius: "8px", cursor: "pointer"}}
                          onClick={() => window.open(`http://localhost:5000/api/file/${msg.fileData.filename}`, "_blank")}
                        />
                      ) : (
                        <a 
                          href={`http://localhost:5000/api/file/${msg.fileData.filename}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{display: "flex", alignItems: "center", gap: "5px", color: "inherit", textDecoration: "underline"}}
                        >
                          📄 Download {msg.fileData.originalName || "File"}
                        </a>
                      )}
                    </div>
                  )}

                  <span className="msg-time" style={{fontSize: '0.65rem', opacity: 0.7, float: 'right', marginTop: '4px'}}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ✅ FOOTER WITH ATTACHMENT */}
        <div className="chat-footer-wrapper" style={{background: 'white', borderTop: '1px solid #eee'}}>
          
          {/* Preview Selected File */}
          {selectedFile && (
            <div className="file-preview" style={{padding: '5px 15px', fontSize: '0.8rem', background: '#f0f9ff', borderBottom: '1px solid #e0f2fe', display: 'flex', justifyContent: 'space-between'}}>
              <span>📎 {selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} style={{background: 'none', border: 'none', color: 'red', cursor: 'pointer'}}>✕</button>
            </div>
          )}

          <form className="chat-footer" onSubmit={handleSend} style={{padding: '10px 15px', display: 'flex', gap: '10px'}}>
            {/* 📎 Attachment Button */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()}
              style={{background: '#e2e8f0', color: '#475569', borderRadius: '50%', width: '35px', height: '35px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'}}
              title="Attach File"
            >
              📎
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{display: "none"}} 
            />

            <input 
              type="text" 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isUploading}
            />
            <button type="submit" disabled={isUploading || (!newMessage.trim() && !selectedFile)}>
              {isUploading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPopup;