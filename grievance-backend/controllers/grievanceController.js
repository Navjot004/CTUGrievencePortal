import Grievance from "../models/GrievanceModel.js";

/* =====================================================
   1️⃣ STUDENT → SUBMIT GRIEVANCE
   → Goes to CATEGORY inbox (UNASSIGNED)
===================================================== */
export const submitGrievance = async (req, res) => {
  try {
    const attachment = req.file ? req.file.path : null;

    const {
      userId,
      name,
      email,
      phone,
      regid,
      studentProgram,   // ✅ required
      category,         // ✅ ONLY routing key
      message,
    } = req.body;

    // 🔒 Safety validation
    if (!studentProgram || !category) {
      return res.status(400).json({
        message: "Student program or category missing",
      });
    }

    const grievance = await Grievance.create({
      userId,
      name,
      email,
      phone,
      regid,

      studentProgram,
      category,
      message,

      attachment,

      assignedTo: null,
      assignedRole: null,
      assignedBy: null,

      status: "Pending",
    });

    res.status(201).json({
      message: "✅ Grievance submitted successfully",
      grievance,
    });

  } catch (err) {
    console.error("Submit Error Details:", err);
    console.error("Error Stack:", err.stack);
    res.status(500).json({ 
      message: "Failed to submit grievance",
      error: err.message || "Unknown error"
    });
  }
};


/* =====================================================
   2️⃣ MASTER ADMIN → SEE ALL GRIEVANCES
===================================================== */
export const getAllGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find().sort({ createdAt: -1 });
    res.json(grievances);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch grievances" });
  }
};


/* =====================================================
   3️⃣ CATEGORY ADMIN → CATEGORY INBOX
   → Only grievances of THEIR category
===================================================== */
export const getCategoryGrievances = async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category).trim();

    const grievances = await Grievance.find({ category })
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch category grievances" });
  }
};


/* =====================================================
   4️⃣ CATEGORY ADMIN → ASSIGN TO STAFF (5-digit)
===================================================== */
export const assignToStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId, adminId } = req.body;

    const grievance = await Grievance.findByIdAndUpdate(
      id,
      {
        assignedTo: staffId,
        assignedRole: "staff",
        assignedBy: adminId,
        status: "Assigned",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.json({
      message: "✅ Assigned to staff successfully",
      grievance,
    });
  } catch (err) {
    console.error("Assign Error:", err);
    res.status(500).json({ message: "Assignment failed" });
  }
};


/* =====================================================
   5️⃣ STAFF → SEE ONLY ASSIGNED GRIEVANCES
===================================================== */
export const getAssignedGrievances = async (req, res) => {
  try {
    const { staffId } = req.params;

    const grievances = await Grievance.find({
      assignedTo: staffId
    }).sort({ createdAt: -1 });

    res.json(grievances);
  } catch (err) {
    console.error("getAssignedGrievances ERROR:", err);
    res.status(500).json({ message: "Failed to fetch assigned grievances" });
  }
};


/* =====================================================
   6️⃣ STUDENT → OWN GRIEVANCE HISTORY
===================================================== */
export const getUserGrievances = async (req, res) => {
  try {
    const { userId } = req.params;

    const grievances = await Grievance.find({ userId })
      .sort({ createdAt: -1 });

    res.json(grievances);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user grievances" });
  }
};


/* =====================================================
   7️⃣ STAFF / ADMIN → UPDATE STATUS
===================================================== */
export const updateGrievanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionRemarks, resolvedBy } = req.body;

    const grievance = await Grievance.findByIdAndUpdate(
      id,
      {
        status,
        resolutionRemarks,
        resolvedBy,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.json({
      message: "✅ Grievance updated successfully",
      grievance,
    });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ Get Grievance Details with Assigned Staff Info
export const getGrievanceDetail = async (req, res) => {
  try {
    const { grievanceId } = req.params;

    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ error: "Grievance not found" });
    }

    // Fetch assigned staff details if available
    let staffInfo = null;
    if (grievance.assignedTo) {
      // Import User model dynamically to avoid circular dependency
      const { default: User } = await import("../models/UserModel.js");
      const staff = await User.findOne({ id: grievance.assignedTo });
      if (staff) {
        staffInfo = {
          id: staff.id,
          name: staff.fullName || staff.name || grievance.assignedTo,
          department: grievance.category
        };
      }
    }

    res.json({
      name: grievance.name,
      message: grievance.message,
      regid: grievance.regid,
      category: grievance.category,
      assignedStaff: staffInfo
    });
  } catch (err) {
    console.error("Error fetching grievance details:", err);
    res.status(500).json({ error: "Failed to fetch grievance details" });
  }
};

