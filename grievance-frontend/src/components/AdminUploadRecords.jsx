import React, { useState } from "react";
import "../styles/Dashboard.css"; // Uses styles from Dashboard.css

const AdminUploadRecords = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Please select an Excel file first.");
      return;
    }

    // Basic frontend validation to check extension
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setMessage("❌ Invalid file format. Please upload .xlsx or .xls file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/api/admin/upload-records", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "✅ Upload Successful!");
        // Optional: Clear file input after success
        // setFile(null); 
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      setMessage("❌ Server Error. Could not upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h3 className="upload-heading">Upload University Records (Excel)</h3>
      <p className="upload-info">
        Upload <strong>.xlsx, .csv</strong> file with columns: <em>ID, Name, Email, Role, Department, Program</em>
      </p>

      <div className="upload-box">
        {/* ✅ Updated ACCEPT Attribute for better compatibility */}
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange} 
          className="upload-input"
        />
        
        <button 
          onClick={handleUpload} 
          disabled={loading} 
          className="upload-btn"
        >
          {loading ? "Uploading..." : "Upload Records"}
        </button>
      </div>

      {message && (
        <div 
          className="upload-message"
          style={{
            color: message.startsWith("❌") ? "#dc2626" : "#16a34a",
            backgroundColor: message.startsWith("❌") ? "#fef2f2" : "#f0fdf4"
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminUploadRecords;