import Grievance from "../models/GrievanceModel.js";

/* =====================================================
   1️⃣ STUDENT → SUBMIT GRIEVANCE
   → Goes to CATEGORY inbox (UNASSIGNED)
===================================================== */
export const submitGrievance = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      phone,
      regid,
      studentProgram,   // ✅ required
      category,         // ✅ ONLY routing key
      message,
      attachment,       // ✅ Extract attachment from JSON body
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

      attachment: attachment || "", // ✅ Save the filename string

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
    const { staffId, adminId, deadline } = req.body;

    // Debug: log incoming assign payload
    console.log(`Assign request for grievance ${id} -> staff: ${staffId}, admin: ${adminId}, deadline: ${deadline}`);

    // ✅ Prevent assigning to self (submitter)
    const existingGrievance = await Grievance.findById(id);
    if (!existingGrievance) return res.status(404).json({ message: "Grievance not found" });
    
    if (existingGrievance.userId === staffId) {
        return res.status(400).json({ message: "❌ Cannot assign grievance to the staff member who submitted it." });
    }

    // Validate deadline (if provided) must not be before grievance creation date.
    // Compare only by calendar date (ignore time) so a deadline on the same day is allowed.
    let deadlineDate = null;
    if (deadline) {
      const parsed = new Date(deadline);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "Invalid deadline date" });
      }

      // Compare date-only values to allow same-day deadlines.
      const parsedDateOnly = new Date(parsed.toISOString().slice(0, 10));
      const createdDateOnly = new Date(existingGrievance.createdAt.toISOString().slice(0, 10));

      if (parsedDateOnly < createdDateOnly) {
        return res.status(400).json({ message: "Deadline cannot be earlier than grievance creation date" });
      }

      // Keep the original parsed value (preserve any time if provided)
      deadlineDate = parsed;
    }

    const update = {
      assignedTo: staffId,
      assignedRole: "staff",
      assignedBy: adminId,
      status: "Assigned",
      updatedAt: Date.now(),
    };

    if (deadlineDate) update.deadlineDate = deadlineDate;

    // Debug: log the update object that will be applied
    console.log('Assign update object:', update);

    const grievance = await Grievance.findByIdAndUpdate(id, update, { new: true });

    console.log('Assign result (saved grievance):', grievance);

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

    // Return only fields required by the UI to reduce response size and speed the query
    const grievances = await Grievance.find({ assignedTo: staffId })
      .select('name email regid message createdAt deadlineDate status attachment _id assignedTo updatedAt')
      .sort({ createdAt: -1 });

    console.log(`getAssignedGrievances: returning ${grievances.length} grievances for staff ${staffId}`);
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
      assignedStaff: staffInfo,
      createdAt: grievance.createdAt,
      deadlineDate: grievance.deadlineDate || null
    });
  } catch (err) {
    console.error("Error fetching grievance details:", err);
    res.status(500).json({ error: "Failed to fetch grievance details" });
  }
};
