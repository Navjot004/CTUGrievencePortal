const express = require("express");
const router = express.Router();
const adminStaffController = require("../controllers/adminStaffController");

// 1. Get All Staff (For displaying the list)
// Frontend call: fetch("http://localhost:5000/api/admin-staff/all")
router.get("/all", adminStaffController.getAllStaff);

// 2. Manage Role (Promote/Demote)
// Frontend call: fetch(".../role", { method: "POST" })
router.post("/role", adminStaffController.manageRole);

// 3. Check Admin Status (For Login/Protection)
// Frontend call: fetch(".../check/:id")
router.get("/check/:id", adminStaffController.checkAdminStatus);

module.exports = router;