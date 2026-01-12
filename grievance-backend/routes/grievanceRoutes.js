import express from "express";
import {
  submitGrievance,
  getAllGrievances,
  getCategoryGrievances,
  getUserGrievances,
  getAssignedGrievances,
  updateGrievanceStatus,
  assignToStaff,
  getGrievanceDetail,
  requestExtension,
  resolveExtension
} from "../controllers/grievanceController.js";

const router = express.Router();

/* ================= STUDENT ================= */
// ✅ Student submits grievance (CATEGORY based)
router.post("/submit", submitGrievance);

// ✅ Student grievance history
router.get("/user/:userId", getUserGrievances);

// ✅ Get grievance details by ID (for chat header) - with assigned staff info
router.get("/detail/:grievanceId", getGrievanceDetail);

/* ================= MASTER ADMIN ================= */
// ✅ Master Admin sees ALL grievances
router.get("/all", getAllGrievances);

/* ================= CATEGORY ADMIN ================= */
// ✅ Category Admin sees ONLY their category grievances
router.get("/category/:category", getCategoryGrievances);

// ✅ Category Admin assigns grievance to staff
router.put("/assign/:id", assignToStaff);

/* ================= STAFF ================= */
// ✅ Staff sees only grievances assigned to them
router.get("/assigned/:staffId", getAssignedGrievances);

/* ================= UPDATE (STAFF / ADMIN) ================= */
// ✅ Update grievance status (Resolve / Reject / In Progress)
router.put("/update/:id", updateGrievanceStatus);

/* ================= EXTENSION ================= */
// ✅ Staff requests extension
router.post("/extension/request/:id", requestExtension);

// ✅ Admin resolves extension
router.post("/extension/resolve/:id", resolveExtension);

export default router;
