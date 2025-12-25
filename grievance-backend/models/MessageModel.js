import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  grievanceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Grievance", 
    required: true 
  },
  senderId: { type: String, required: true }, // e.g., STU001 or STF001
  senderRole: { type: String, required: true }, // "student", "staff", "admin"
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;