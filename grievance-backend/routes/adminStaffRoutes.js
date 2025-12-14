import express from "express";
import {
  addAdminStaff,
  listAdminStaff,
  removeAdminStaff,
  checkAdminStaff,
} from "../controllers/adminStaffController.js";

const router = express.Router();

/**
 * ⚠️ IMPORTANT: order matters!
 * /check/:staffId must come BEFORE /:department
 */

// ✅ Check if a staff is an admin staff (used on staff login)
router.get("/check/:staffId", checkAdminStaff);

// ✅ List all admin staff for a department
//    GET /api/admin-staff/Accounts
//    GET /api/admin-staff/Admission
router.get("/:department", listAdminStaff);

// ✅ Add a staff to a department's admin staff list
//    POST /api/admin-staff
//    body: { staffId: "STF001", department: "Accounts" }
router.post("/", addAdminStaff);

// ✅ Remove a staff from a department's admin staff list
//    DELETE /api/admin-staff/Accounts/STF001
router.delete("/:department/:staffId", removeAdminStaff);

export default router;