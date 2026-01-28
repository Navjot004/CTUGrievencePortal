import express from "express";
import ExcelJS from "exceljs";
import Grievance from "../models/GrievanceModel.js";

const router = express.Router();

router.get("/export", async (req, res) => {
  try {
    const {
      searchStudentId,
      searchStaffId,
      filterStatus,
      filterDepartment,
      filterMonth,
    } = req.query;

    let query = {};

    if (searchStudentId) {
      query.userId = { $regex: searchStudentId, $options: "i" };
    }

    if (searchStaffId) {
      query.assignedTo = { $regex: searchStaffId, $options: "i" };
    }

    if (filterStatus && filterStatus !== "All") {
      query.status = filterStatus;
    }

    if (filterDepartment && filterDepartment !== "All") {
      query.$or = [
        { category: filterDepartment },
        { school: filterDepartment },
      ];
    }

    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.createdAt = { $gte: start, $lte: end };
    }

    const grievances = await Grievance.find(query).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Grievances");

    sheet.columns = [
      { header: "Student ID", key: "userId", width: 18 },
      { header: "Department", key: "department", width: 25 },
      { header: "Message", key: "message", width: 45 },
      { header: "Status", key: "status", width: 15 },
      { header: "Assigned Staff", key: "assignedTo", width: 20 },
      { header: "Created At", key: "createdAt", width: 22 },
    ];

    grievances.forEach((g) => {
      sheet.addRow({
        userId: g.userId,
        department: g.category || g.school || "N/A",
        message: g.message,
        status: g.status,
        assignedTo: g.assignedTo || "Not Assigned",
        createdAt: g.createdAt.toLocaleString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=filtered_grievances.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel Export Error:", err);
    res.status(500).json({ message: "Excel export failed" });
  }
});

export default router;
