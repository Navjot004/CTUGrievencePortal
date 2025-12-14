// controllers/adminStaffController.js
import AdminStaff from "../models/AdminStaffModel.js";

// ✅ Add a staff as "admin staff" for a department
export const addAdminStaff = async (req, res) => {
  try {
    const { staffId, department } = req.body;

    if (!staffId || !department) {
      return res
        .status(400)
        .json({ message: "staffId and department are required" });
    }

    const normalizedStaffId = staffId.toUpperCase().trim();

    // Create or fail if duplicate (unique index will protect duplicates)
    const adminStaff = await AdminStaff.create({
      staffId: normalizedStaffId,
      department,
    });

    return res.status(201).json({
      message: "✅ Staff added as department admin successfully",
      adminStaff,
    });
  } catch (err) {
    console.error("❌ addAdminStaff error:", err.message);

    // Handle duplicate key (staff already admin in that department)
    if (err.code === 11000) {
      return res.status(400).json({
        message: "This staff is already an admin for this department",
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ List all admin staff for a specific department
export const listAdminStaff = async (req, res) => {
  try {
    const { department } = req.params;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const admins = await AdminStaff.find({ department }).sort({
      createdAt: -1,
    });

    return res.status(200).json(admins);
  } catch (err) {
    console.error("❌ listAdminStaff error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Remove a staff from admin staff list of a department
export const removeAdminStaff = async (req, res) => {
  try {
    const { department, staffId } = req.params;

    if (!department || !staffId) {
      return res
        .status(400)
        .json({ message: "Department and staffId are required" });
    }

    const normalizedStaffId = staffId.toUpperCase().trim();

    const deleted = await AdminStaff.findOneAndDelete({
      department,
      staffId: normalizedStaffId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Admin staff entry not found for this department",
      });
    }

    return res.status(200).json({
      message: "✅ Staff removed from department admin list",
      deleted,
    });
  } catch (err) {
    console.error("❌ removeAdminStaff error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Check if a staff is admin staff for any department
export const checkAdminStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    const normalizedStaffId = staffId.toUpperCase().trim();

    const entries = await AdminStaff.find({ staffId: normalizedStaffId });

    const isAdmin = entries.length > 0;
    const departments = entries.map((e) => e.department);

    return res.status(200).json({
      isAdmin,
      departments, // e.g. ["Accounts"] or ["Examination"]
    });
  } catch (err) {
    console.error("❌ checkAdminStaff error:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
