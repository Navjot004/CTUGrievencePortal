import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  regid: { type: String },
  
  school: { type: String, required: true },
  category: { type: String, required: true },
  message: { type: String, required: true },
  
  // ✅ Stores uploaded document path (from Multer)
  attachment: { type: String, default: null },

  // ✅ Assignment Flow
  assignedTo: { type: String, default: null },    // Can be ADM_* or STF*
  assignedRole: { type: String, default: null },  // "admin" or "staff"
  assignedBy: { type: String, default: null },    // Who assigned (e.g. ADM01, ADM_ACCOUNT)

  resolvedBy: { type: String, default: null },
  resolutionRemarks: { type: String, default: "" },
  
  status: { 
    type: String, 
    enum: ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"], 
    default: "Pending" 
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Grievance = mongoose.model("Grievance", grievanceSchema);
export default Grievance;
