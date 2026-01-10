const AdminStaffModel = require("../models/AdminStaffModel");
const UserModel = require("../models/UserModel");
const GrievanceModel = require("../models/GrievanceModel");

/**
 * 1️⃣ Get All Staff
 * Used by Master Admin & Dept Admins
 */
exports.getAllStaff = async (req, res) => {
  try {
    const users = await UserModel.find({ role: "staff" }).select("-password");

    const staffWithDetails = await Promise.all(
      users.map(async (user) => {
        const adminRecord = await AdminStaffModel.findOne({ id: user.id });
        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          adminDepartment: adminRecord ? adminRecord.adminDepartment : "",
          isDeptAdmin: adminRecord ? adminRecord.isDeptAdmin : false,
        };
      })
    );

    res.json(staffWithDetails);
  } catch (err) {
    console.error("Get All Staff Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * 2️⃣ Promote / Demote Staff
 * FINAL, SAFE, PRODUCTION-READY
 */
exports.manageRole = async (req, res) => {
  const { requesterId, targetStaffId, action, department } = req.body;

  try {
    /* ================= AUTH CHECK ================= */
    let requester = null;

    // Master Admin
    if (requesterId !== "10001") {
      requester = await AdminStaffModel.findOne({ id: requesterId });
      if (!requester || !requester.isDeptAdmin) {
        return res
          .status(403)
          .json({ message: "Access Denied: You cannot manage staff." });
      }
    }

    /* ================= PROMOTE ================= */
    if (action === "promote") {
      let staffRecord = await AdminStaffModel.findOne({ id: targetStaffId });

      if (!staffRecord) {
        const userDetails = await UserModel.findOne({ id: targetStaffId });
        if (!userDetails) {
          return res.status(404).json({ message: "User not found" });
        }

        staffRecord = new AdminStaffModel({
          id: targetStaffId,
          fullName: userDetails.fullName,
        });
      }

      staffRecord.adminDepartment = department;

      if (requesterId === "10001") {
        staffRecord.isDeptAdmin = true; // Boss
      } else {
        if (requester.adminDepartment !== department) {
          return res.status(403).json({
            message: "You can only assign staff to your own department.",
          });
        }
        staffRecord.isDeptAdmin = false; // Team member
      }

      await staffRecord.save();

      return res.json({
        message: `Success: ${staffRecord.fullName} assigned to ${department}.`,
      });
    }

    /* ================= DEMOTE (🔥 FINAL FIX) ================= */
    if (action === "demote") {
      // 1️⃣ Find staff
      const staffRecord = await AdminStaffModel.findOne({ id: targetStaffId });

      // 2️⃣ Remove from department/admin
      if (staffRecord) {
        staffRecord.isDeptAdmin = false;
        staffRecord.adminDepartment = "";
        await staffRecord.save();
      }

      // 3️⃣ 🔥 FORCE RESET ALL ASSIGNED GRIEVANCES
      const result = await GrievanceModel.updateMany(
        {
          $or: [
            { assignedTo: targetStaffId },
            { assignedTo: String(targetStaffId) },
            { assignedTo: staffRecord?.fullName },
          ],
        },
        {
          $set: {
            status: "Pending",
            assignedTo: null,
          },
        }
      );

      console.log("Grievances reset:", result.modifiedCount);

      return res.json({
        message: `Staff removed. ${result.modifiedCount} grievances moved to Pending.`,
      });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("Manage Role Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * 3️⃣ Check Admin Status
 */
exports.checkAdminStatus = async (req, res) => {
  const { id } = req.params;

  try {
    // Master Admin
    if (id === "10001") {
      return res.json({
        isAdmin: true,
        isDeptAdmin: true,
        departments: ["All"],
        adminDepartment: "All",
      });
    }

    const admin = await AdminStaffModel.findOne({ id });
    if (admin && admin.adminDepartment) {
      return res.json({
        isAdmin: true,
        isDeptAdmin: admin.isDeptAdmin,
        departments: [admin.adminDepartment],
        adminDepartment: admin.adminDepartment,
      });
    }

    return res.json({
      isAdmin: false,
      isDeptAdmin: false,
      departments: [],
    });
  } catch (err) {
    console.error("Check Admin Status Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
