import React, { useState, useEffect, useRef } from "react";
import "../styles/Dashboard.css"; // Ensure this has basic modal styles

function ChatPopup({ isOpen, onClose, grievanceId, currentUserId, currentUserRole }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Poll for messages every 3 seconds (simple real-time)
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
    const interval = setInterval(fetchMessages, 3000); // Auto-refresh

    return () => clearInterval(interval);
  }, [isOpen, grievanceId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievanceId,
          senderId: currentUserId,
          senderRole: currentUserRole,
          message: newMessage,
        }),
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages([...messages, sentMsg]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <h3>Grievance Chat</h3>
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
                  <p>{msg.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-footer" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatPopup;