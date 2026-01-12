import React, { useState, useEffect, useRef } from "react";
import "../styles/Dashboard.css"; // Ensure this has basic modal styles

// ✅ Advanced Icons
import { PaperclipIcon, CameraIcon, SendIcon, FileIcon, XIcon as CloseIcon } from "./Icons";

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
    <div className="chat-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div className="chat-modal" style={{
        position: 'relative', width: '100%', maxWidth: '450px', height: '85vh', maxHeight: '700px',
        backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>

        {/* ✅ CAMERA OVERLAY */}
        {showCamera && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#000', zIndex: 50, display: 'flex', flexDirection: 'column'
          }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ position: 'absolute', bottom: '30px', width: '100%', display: 'flex', justifyContent: 'center', gap: '20px', zIndex: 60 }}>
              <button
                onClick={() => setShowCamera(false)}
                style={{ padding: '12px 24px', borderRadius: '30px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCapture}
                style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid white', background: 'transparent', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* ✅ HEADER */}
        <div style={{
          padding: '16px 20px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {currentUserRole === "student" ? grievanceData?.assignedStaff?.name?.[0] || "S" : grievanceData?.name?.[0] || "U"}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                {currentUserRole === "student" ? (grievanceData?.assignedStaff?.name || 'Support Team') : (grievanceData?.name || 'Student')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                {currentUserRole === "student" ? (grievanceData?.assignedStaff ? grievanceData.assignedStaff.department : 'Support') : (grievanceData?.userId || 'Online')}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <CloseIcon />
          </button>
        </div>

        {/* ✅ CHAT BODY */}
        <div className="chat-body" ref={chatBodyRef} style={{
          flex: 1, overflowY: 'auto', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💬</div>
              <p>No messages yet.<br />Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.senderId === currentUserId;
              const showAvatar = !isMine && (index === 0 || messages[index - 1].senderId !== msg.senderId);

              return (
                <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>

                  {/* Avatar for received messages */}
                  {!isMine && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#cbd5e1', flexShrink: 0, opacity: showAvatar ? 1 : 0 }}>
                      {showAvatar && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 'bold' }}>{msg.sender?.[0]}</div>}
                    </div>
                  )}

                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: '18px',
                    borderBottomRightRadius: isMine ? '4px' : '18px',
                    borderBottomLeftRadius: isMine ? '18px' : '4px',
                    background: isMine ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#ffffff',
                    color: isMine ? 'white' : '#1e293b',
                    boxShadow: isMine ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                    fontSize: '0.95rem',
                    lineHeight: '1.4',
                    position: 'relative'
                  }}>
                    {/* ✅ DISPLAY FILE */}
                    {msg.fileData && (
                      <div style={{ marginBottom: msg.message ? '8px' : '0' }}>
                        {msg.fileData.contentType.startsWith("image/") ? (
                          <img
                            src={`http://localhost:5000/api/file/${msg.fileData.filename}`}
                            alt="attachment"
                            style={{ maxWidth: "100%", borderRadius: "12px", cursor: "pointer", display: 'block' }}
                            onClick={() => window.open(`http://localhost:5000/api/file/${msg.fileData.filename}`, "_blank")}
                          />
                        ) : (
                          <a
                            href={`http://localhost:5000/api/file/${msg.fileData.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
                              background: isMine ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                              borderRadius: "10px", textDecoration: "none", color: 'inherit', fontWeight: '500'
                            }}
                          >
                            <FileIcon />
                            <span style={{ fontSize: '0.85rem' }}>Download File</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* TEXT */}
                    {msg.message}

                    {/* TIME */}
                    <div style={{
                      fontSize: '0.65rem', marginTop: '4px', textAlign: 'right',
                      opacity: 0.7, color: isMine ? 'rgba(255,255,255,0.8)' : '#94a3b8'
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ✅ FOOTER INPUT AREA */}
        <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #f1f5f9' }}>

          {/* File Preview */}
          {selectedFile && (
            <div style={{
              marginBottom: '10px', padding: '8px 12px', background: '#eff6ff',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '0.85rem', color: '#1e40af'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><PaperclipIcon width="16" height="16" /> {selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '6px 8px', borderRadius: '30px' }}>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
              title="Attach File"
            >
              <PaperclipIcon />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
              title="Camera"
            >
              <CameraIcon />
            </button>

            {/* Text Input */}
            <input
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isUploading}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '8px 4px', fontSize: '0.95rem', outline: 'none', color: '#1e293b' }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isUploading || (!newMessage.trim() && !selectedFile)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', border: 'none',
                background: (newMessage.trim() || selectedFile) ? '#6366f1' : '#cbd5e1',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (newMessage.trim() || selectedFile) ? 'pointer' : 'default',
                transition: 'background 0.2s, transform 0.2s',
                transform: (newMessage.trim() || selectedFile) ? 'scale(1)' : 'scale(0.95)'
              }}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );

}

export default ChatPopup;