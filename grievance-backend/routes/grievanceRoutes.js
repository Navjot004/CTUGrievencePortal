import express from "express";
import multer from "multer";
import path from "path";
import {
  submitGrievance,
  getAllGrievances,
  getDepartmentGrievances,
  getUserGrievances,
  getAssignedGrievances,
  updateGrievanceStatus,
} from "../controllers/grievanceController.js";

const router = express.Router();

// ✅ Configure Multer Storage (for file uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Files will be saved in 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp-originalName
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// 🟢 Submit a new grievance (with optional file: "attachment")
router.post("/", upload.single("attachment"), submitGrievance);

// 🟠 Main Admin - Get ALL grievances
router.get("/all", getAllGrievances);

// 🟣 Department Admins - Get grievances for their specific department queue
router.get("/department/:deptName", getDepartmentGrievances);

// 🔵 User History - Get grievances submitted by a specific student/staff
router.get("/user/:userId", getUserGrievances);

// 🟡 School/Staff Admin - Get grievances assigned SPECIFICALLY to an ID (e.g. ADM_ENG)
router.get("/assigned/:assigneeId", getAssignedGrievances);

// 🔴 Update Status / Assignment
router.put("/:id", updateGrievanceStatus);

export default router;