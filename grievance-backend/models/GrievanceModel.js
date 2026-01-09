import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema(
  {
    // ================= STUDENT INFO =================
    userId: { type: String, required: true }, // 8-digit Student ID
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    regid: { type: String },

    // ================= STUDENT ACADEMIC =================
    studentProgram: {
      type: String,
      required: true // e.g. B.Tech CSE
    },

    // ================= GRIEVANCE ROUTING (ONLY CATEGORY) =================
    category: {
      type: String,
      required: true,
      enum: [
        "Accounts",
        "Student Welfare",
        "Student Section",
        "Admission",
        "Examination",
        "School of Engineering and Technology",
        "School of Management Studies",
        "School of Law",
        "School of Pharmaceutical Sciences",
        "School of Hotel Management",
        "School of Design and innovation",
        "School of Allied Health Sciences",
        "School of Social Sciences and Liberal Arts"
      ]
    },

    // ================= CONTENT =================
    message: { type: String, required: true },
    attachment: { type: String, default: null },

    // ================= ASSIGNMENT FLOW =================
    assignedTo: { type: String, default: null },
    assignedRole: {
      type: String,
      enum: ["staff", "admin"],
      default: null
    },
    assignedBy: { type: String, default: null },

    // ================= RESOLUTION =================
    resolvedBy: { type: String, default: null },
    resolutionRemarks: { type: String, default: "" },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

const Grievance =
  mongoose.models.Grievance ||
  mongoose.model("Grievance", grievanceSchema);

export default Grievance;
