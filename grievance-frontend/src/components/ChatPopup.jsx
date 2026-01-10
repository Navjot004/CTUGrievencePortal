import React, { useState, useEffect, useRef } from "react";
import "../styles/Dashboard.css"; // Ensure this has basic modal styles

// ✅ Advanced Icons
const PaperclipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>;

function ChatPopup({ isOpen, onClose, grievanceId, currentUserId, currentUserRole }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // ✅ NEW: Track selected file
  const [isUploading, setIsUploading] = useState(false);  // ✅ NEW: Loading state for upload
  const [grievanceData, setGrievanceData] = useState(null); // ✅ Store grievance details
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // ✅ NEW: Ref for hidden file input
  const chatBodyRef = useRef(null); // ✅ NEW: Ref for scroll container
  const hasScrolledRef = useRef(false); // ✅ NEW: Track initial scroll
  const prevMessagesLength = useRef(0); // ✅ NEW: Track message count to detect new messages
  
  const [showCamera, setShowCamera] = useState(false); // ✅ Camera State
  const videoRef = useRef(null); // ✅ Video Ref
  const canvasRef = useRef(null); // ✅ Canvas Ref

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

    // ✅ Reset scroll state when switching chats
    hasScrolledRef.current = false;
    prevMessagesLength.current = 0;

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

  // ✅ SMART SCROLL LOGIC (Fixes auto-scroll issue)
  useEffect(() => {
    if (!messagesEndRef.current || !chatBodyRef.current) return;

    const container = chatBodyRef.current;
    const currentLength = messages.length;
    const prevLength = prevMessagesLength.current;
    const isNewMessage = currentLength > prevLength;

    // Check if user is near bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    const lastMsg = messages[currentLength - 1];
    const isMyMessage = lastMsg?.senderId === currentUserId;

    // 1. First load? Force scroll instantly
    if (!hasScrolledRef.current && currentLength > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      hasScrolledRef.current = true;
    } 
    // 2. Only scroll if a NEW message arrived
    else if (isNewMessage) {
      // Scroll if I sent it OR if I was already reading at the bottom
      if (isMyMessage || isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Update length ref
    prevMessagesLength.current = currentLength;
  }, [messages, currentUserId]);

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

  // ✅ CAMERA LOGIC
  useEffect(() => {
    let stream = null;
    if (showCamera) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.error("Camera Error:", err);
          alert("Could not access camera. Please check permissions.");
          setShowCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_capture_${Date.now()}.png`, { type: "image/png" });
          setSelectedFile(file);
          setShowCamera(false);
        }
      }, "image/png");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal" style={{ position: 'relative' }}>
        
        {/* ✅ CAMERA OVERLAY */}
        {showCamera && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#000', zIndex: 20, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', borderRadius: '12px'
          }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={{ position: 'absolute', bottom: '20px', display: 'flex', gap: '15px', zIndex: 30 }}>
              <button 
                onClick={() => setShowCamera(false)}
                style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(5px)', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleCapture}
                style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)' }}
              >
                Capture
              </button>
            </div>
          </div>
        )}

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
        
        <div className="chat-body" ref={chatBodyRef}>
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

          {/* ✅ Icons Row (Above Input) */}
          <div style={{ display: 'flex', gap: '15px', padding: '10px 15px 0 15px' }}>
            {/* 📎 Attachment Button */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current.click()}
              style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'}}
              title="Attach File"
            >
              <PaperclipIcon />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{display: "none"}} 
            />

            {/* 📷 Camera Button */}
            <button 
              type="button" 
              onClick={() => setShowCamera(true)}
              style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'}}
              title="Open Camera"
            >
              <CameraIcon />
            </button>
          </div>

          <form className="chat-footer" onSubmit={handleSend} style={{padding: '5px 15px 15px 15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isUploading}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={isUploading || (!newMessage.trim() && !selectedFile)} style={{ width: '100%' }}>
              {isUploading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPopup;