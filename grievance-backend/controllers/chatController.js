import Message from "../models/MessageModel.js";

// ✅ Send a message
export const sendMessage = async (req, res) => {
  try {
    const { grievanceId, senderId, senderRole, message } = req.body;

    if (!grievanceId || !senderId || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newMessage = await Message.create({
      grievanceId,
      senderId,
      senderRole,
      message,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get messages for a specific grievance
export const getMessages = async (req, res) => {
  try {
    const { grievanceId } = req.params;
    
    // Sort by oldest first so chat reads top-to-bottom
    const messages = await Message.find({ grievanceId }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Server Error" });
  }
};