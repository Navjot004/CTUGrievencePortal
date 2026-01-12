// Add these routes after the upload-records route in server.js

// Get list of uploaded files
app.get("/api/admin/uploaded-files", verifyToken, async (req, res) => {
    try {
        // This is a placeholder - you'll need to implement file tracking
        // For now, return empty array
        res.json({ files: [] });
    } catch (err) {
        console.error("Error fetching files:", err);
        res.status(500).json({ message: "Error fetching files" });
    }
});

// Download uploaded file
app.get("/api/admin/download-file/:filename", verifyToken, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, 'uploads', filename);

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({ message: "File not found" });
        }
    } catch (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Error downloading file" });
    }
});

// Preview file (send file for viewing)
app.get("/api/admin/preview-file/:filename", verifyToken, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, 'uploads', filename);

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).json({ message: "File not found" });
        }
    } catch (err) {
        console.error("Preview error:", err);
        res.status(500).json({ message: "Error previewing file" });
    }
});

// Export all users to Excel
app.get("/api/admin/export-users", verifyToken, async (req, res) => {
    try {
        const users = await User.find({}).select('id fullName email role department program isDeptAdmin adminDepartment');

        // Convert to Excel format
        const data = users.map(user => ({
            ID: user.id,
            Name: user.fullName,
            Email: user.email,
            Role: user.role,
            Department: user.department || user.adminDepartment || '',
            Program: user.program || '',
            'Is Dept Admin': user.isDeptAdmin ? 'Yes' : 'No'
        }));

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=users_export.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error("Export error:", err);
        res.status(500).json({ message: "Error exporting users" });
    }
});
