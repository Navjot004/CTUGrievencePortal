const AdminStaffModel = require("../models/AdminStaffModel");
const UserModel = require("../models/UserModel");

// 1. Get All Staff (For Master Admin & Dept Admins to view list)
exports.getAllStaff = async (req, res) => {
  try {
    // Sirf 'staff' role wale users chahiye
    // Ham 'AdminStaffModel' se data merge karke bhejenge taaki current status dikhe
    const users = await UserModel.find({ role: "staff" }).select("-password");

    const staffWithDetails = await Promise.all(
      users.map(async (user) => {
        const adminRecord = await AdminStaffModel.findOne({ id: user.id });
        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          department: user.department, // Original hiring department
          
          // Role details from AdminStaffModel
          adminDepartment: adminRecord ? adminRecord.adminDepartment : "",
          isDeptAdmin: adminRecord ? adminRecord.isDeptAdmin : false,
        };
      })
    );

    res.json(staffWithDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. Manage Role (Promote/Demote) - ✅ THE MAIN FIX IS HERE
exports.manageRole = async (req, res) => {
  const { requesterId, targetStaffId, action, department } = req.body;

  try {
    // A. Validation: Check if Requester exists
    // Master Admin (10001) is always allowed, even if not in DB explicitly yet
    let requester = null;
    if (requesterId !== "10001") {
      requester = await AdminStaffModel.findOne({ id: requesterId });
      // Agar requester Master nahi hai aur DeptAdmin bhi nahi hai, toh bhagao
      if (!requester || !requester.isDeptAdmin) {
        return res.status(403).json({ message: "Access Denied: You cannot manage staff." });
      }
    }

    // B. Logic for Promotion/Demotion
    if (action === "promote") {
      // Find or Create the staff record in AdminStaffModel
      let staffRecord = await AdminStaffModel.findOne({ id: targetStaffId });
      
      if (!staffRecord) {
        // Fetch name from User Model for reference
        const userDetails = await UserModel.findOne({ id: targetStaffId });
        if (!userDetails) return res.status(404).json({ message: "User not found" });

        staffRecord = new AdminStaffModel({
          id: targetStaffId,
          fullName: userDetails.fullName,
        });
      }

      // --- 🛑 HIERARCHY LOGIC FIX 🛑 ---
      
      // 1. Assign the Department
      staffRecord.adminDepartment = department;

      // 2. Decide Power Level
      if (requesterId === "10001") {
        // CASE A: Master Admin kar raha hai -> To "BOSS" banao
        staffRecord.isDeptAdmin = true;
      } else {
        // CASE B: Dept Admin (Priya) kar rahi hai -> To sirf "TEAM MEMBER" banao
        staffRecord.isDeptAdmin = false;
        
        // Security Check: Priya can only add to HER OWN department
        if (requester.adminDepartment !== department) {
            return res.status(403).json({ message: "You can only assign staff to your own department." });
        }
      }

      await staffRecord.save();
      return res.json({ message: `Success: ${staffRecord.fullName} assigned to ${department}.` });

    } else if (action === "demote") {
      // Remove Admin Privileges
      const staffRecord = await AdminStaffModel.findOne({ id: targetStaffId });
      if (staffRecord) {
        // Agar Master Admin remove kar raha hai, toh poora hata do
        // Agar Dept Admin remove kar raha hai, toh bas team se hata do
        staffRecord.isDeptAdmin = false;
        staffRecord.adminDepartment = ""; 
        await staffRecord.save();
      }
      return res.json({ message: "Staff removed from role." });
    }

    res.status(400).json({ message: "Invalid action" });

  } catch (err) {
    console.error("Manage Role Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 3. Check Admin Status (Used by Login Page & Protected Routes)
exports.checkAdminStatus = async (req, res) => {
  const { id } = req.params;
  try {
    if (id === "10001") {
      return res.json({ 
        isAdmin: true, 
        isDeptAdmin: true, // Master is basically Super Admin
        departments: ["All"],
        adminDepartment: "All" 
      });
    }

    const admin = await AdminStaffModel.findOne({ id });
    if (admin && admin.adminDepartment) {
      // Return details
      return res.json({ 
        isAdmin: true, 
        isDeptAdmin: admin.isDeptAdmin, // True for Priya, False for Rajesh
        departments: [admin.adminDepartment],
        adminDepartment: admin.adminDepartment
      });
    }

    // Not an admin
    res.json({ isAdmin: false, isDeptAdmin: false, departments: [] });

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};