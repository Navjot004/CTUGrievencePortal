import Grievance from "../models/GrievanceModel.js";

// 1. General Department Map (For Accounts, Admission, etc.)
const departmentAdminMap = {
  "Accounts": "ADM_ACCOUNT",
  "Student Welfare": "ADM_WELFARE",
  "Admission": "ADM_ADMISSION",
  "Examination": "ADM_EXAM",
};

// 2. ✅ NEW: School-Specific HOD Map (Smart Logic)
// This maps the student's "School" to the correct HOD Admin ID
const schoolAdminMap = {
  "School of Engineering and Technology": "ADM_ENG",
  "School of Management Studies": "ADM_MGMT",
  "School of Hotel Management, Airlines and Tourism": "ADM_HOTEL",
  "School of Law": "ADM_LAW",
  "School of Pharmaceutical Sciences": "ADM_PHARMA",
  "School of Design and Innovation": "ADM_DESIGN",
  "School of Allied Health Sciences": "ADM_HEALTH",
  "School of Social Sciences and Liberal Arts": "ADM_SOCIAL"
};

// ✅ Submit a new grievance
export const submitGrievance = async (req, res) => {
  try {
    const { userId, name, email, phone, regid, school, category, message } = req.body;
    
    // Check for file attachment
    const attachment = req.file ? req.file.path : null;

    if (!userId || !name || !email || !school || !category || !message) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // 🧠 SMART ASSIGNMENT LOGIC
    let assignedTo = null;

    // Check if the category is specifically for Academic Department issues
    if (category === "Department" || category === "Academic Department") {
      // Find the HOD for the student's specific school using the map
      assignedTo = schoolAdminMap[school] || "ADM01"; // Fallback to Main Admin if school not found
    } else {
      // Otherwise use the general department map (Accounts, Exam, Welfare, etc.)
      assignedTo = departmentAdminMap[category] || "ADM01";
    }

    const status = assignedTo ? "Assigned" : "Pending"; 

    const grievance = await Grievance.create({
      userId,
      name,
      email,
      phone,
      regid,
      school,
      category,
      message,
      attachment,
      assignedTo,
      assignedRole: assignedTo ? "admin" : null,
      assignedBy: assignedTo ? "SYSTEM_AUTO" : null,
      status,
    });

    res.status(201).json({ 
      message: "✅ Grievance submitted successfully", 
      grievance 
    });
    
  } catch (error) {
    console.error("❌ Error submitting grievance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get all grievances (For Main Admin Dashboard)
export const getAllGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find().sort({ createdAt: -1 });
    res.json(grievances);
  } catch (error) {
    console.error("❌ getAllGrievances:", error);
    res.status(500).json({ message: "Failed to fetch grievances" });
  }
};

// ✅ Get grievances for a specific Department Admin (e.g., ADM_ACCOUNT)
// This is used by AccountAdminDashboard, etc.
export const getDepartmentGrievances = async (req, res) => {
  try {
    const { deptName } = req.params;
    
    // We search by 'category' name to find relevant issues
    const grievances = await Grievance.find({
      category: new RegExp(`^${deptName}$`, "i"), 
    }).sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    console.error("❌ getDepartmentGrievances:", error);
    res.status(500).json({ message: "Error fetching department grievances" });
  }
};

// ✅ Get grievances for a specific User (Student/Staff History)
export const getUserGrievances = async (req, res) => {
  try {
    const { userId } = req.params;
    const grievances = await Grievance.find({ userId }).sort({ createdAt: -1 });
    res.json(grievances);
  } catch (error) {
    console.error("❌ getUserGrievances:", error);
    res.status(500).json({ message: "Error fetching user history" });
  }
};

// ✅ NEW: Get grievances assigned to a specific assignee (e.g., ADM_ENG or STF001)
// This is used by SchoolAdminDashboard and StaffDashboard
export const getAssignedGrievances = async (req, res) => {
  try {
    const { assigneeId } = req.params;
    if (!assigneeId) {
      return res.status(400).json({ message: "Assignee ID is required" });
    }

    const grievances = await Grievance.find({
      assignedTo: assigneeId.toUpperCase(),
    }).sort({ createdAt: -1 });

    res.json(grievances);
  } catch (error) {
    console.error("❌ getAssignedGrievances:", error);
    res.status(500).json({ message: "Error fetching assigned grievances" });
  }
};

// ✅ Update grievance status (Assign, Resolve, etc.)
export const updateGrievanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolvedBy, assignedTo, resolutionRemarks } = req.body;

    // Build update object dynamically
    const updateData = { status };
    if (resolvedBy) updateData.resolvedBy = resolvedBy;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolutionRemarks) updateData.resolutionRemarks = resolutionRemarks;
    updateData.updatedAt = Date.now();

    const grievance = await Grievance.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    res.json({ message: "✅ Grievance updated successfully", grievance });
  } catch (error) {
    console.error("❌ updateGrievanceStatus:", error);
    res.status(500).json({ message: "Error updating grievance" });
  }
};