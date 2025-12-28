import Message from "../models/MessageModel.js";

// Send Message (Supports Text & File)
export const sendMessage = async (req, res) => {
  try {
    // fileData comes from frontend after uploading to /api/upload
    const { grievanceId, senderId, senderRole, sender, message, fileData } = req.body;

    if (!grievanceId || !senderId || !senderRole) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Determine type
    const msgType = fileData ? "file" : "text";
    
    // Auto-text if message is empty but file exists
    const finalMessage = message || (fileData ? `Sent an attachment: ${fileData.originalName}` : "");

    const newMessage = new Message({
      grievanceId,
      senderId,
      senderRole,
      sender,
      message: finalMessage,
      messageType: msgType,
      fileData: fileData || null
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Messages
export const getMessages = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    const messages = await Message.find({ grievanceId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};