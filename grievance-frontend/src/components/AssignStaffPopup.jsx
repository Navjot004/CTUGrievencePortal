// src/components/AssignStaffPopup.jsx
import React, { useEffect, useState } from "react";

function AssignStaffPopup({
  isOpen,
  onClose,
  department,
  grievanceId,
  adminId,
  onAssigned, // (message, statusType) => void
}) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [localMsg, setLocalMsg] = useState("");
  const [localStatus, setLocalStatus] = useState("");

  // Fetch admin staff for this department when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setLocalMsg("");
        setLocalStatus("");

        const res = await fetch(
          `http://localhost:5000/api/admin-staff/${encodeURIComponent(
            department
          )}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load staff");

        setStaffList(data); // each { staffId, department, createdAt }
      } catch (err) {
        console.error("Error loading admin staff:", err);
        setLocalMsg(err.message);
        setLocalStatus("error");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [isOpen, department]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedStaffId) {
      setLocalMsg("Please select a staff member to assign.");
      setLocalStatus("error");
      return;
    }

    setLoadingAssign(true);
    setLocalMsg("Assigning grievance...");
    setLocalStatus("info");

    try {
      const res = await fetch(
        `http://localhost:5000/api/grievances/${grievanceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Assigned",
            assignedTo: selectedStaffId.toUpperCase(),
            assignedRole: "staff",
            assignedBy: adminId,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign");

      const successMsg = `Grievance assigned to ${selectedStaffId.toUpperCase()} successfully!`;

      // Notify parent
      if (onAssigned) {
        onAssigned(successMsg, "success");
      }

      setLoadingAssign(false);
      onClose();
    } catch (err) {
      console.error("Error assigning grievance:", err);
      setLocalMsg(err.message);
      setLocalStatus("error");
      setLoadingAssign(false);
    }
  };

  return (
    <div className="assign-modal-overlay">
      <div className="assign-modal">
        <div className="assign-modal-header">
          <h3>Assign to Staff</h3>
          <button className="assign-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="assign-modal-subtitle">
          Select a staff member from <strong>{department}</strong> department to
          handle this grievance.
        </p>

        {localMsg && (
          <div className={`alert-box ${localStatus}`}>{localMsg}</div>
        )}

        {loading ? (
          <p>Loading staff list...</p>
        ) : staffList.length === 0 ? (
          <div className="empty-state">
            <p>
              No admin staff added for <strong>{department}</strong> yet.
              <br />
              Please add staff in <em>Manage Department Staff</em>.
            </p>
          </div>
        ) : (
          <div className="assign-staff-list">
            {staffList.map((s) => (
              <button
                key={s._id || s.staffId}
                type="button"
                className={`staff-pill ${
                  selectedStaffId === s.staffId ? "selected" : ""
                }`}
                onClick={() => setSelectedStaffId(s.staffId)}
              >
                {s.staffId}
              </button>
            ))}
          </div>
        )}

        <div className="assign-modal-footer">
          <button
            type="button"
            className="assign-cancel-btn"
            onClick={onClose}
            disabled={loadingAssign}
          >
            Cancel
          </button>
          <button
            type="button"
            className="assign-confirm-btn"
            onClick={handleAssign}
            disabled={loadingAssign || !staffList.length}
          >
            {loadingAssign ? "Assigning..." : "Assign Grievance"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignStaffPopup;
