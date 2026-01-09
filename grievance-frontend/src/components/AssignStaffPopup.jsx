import React, { useEffect, useState } from "react";

function AssignStaffPopup({
  isOpen,
  onClose,
  department,
  grievanceId,
  adminId,
  onAssigned,
}) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");

  /* ================= FETCH STAFF ================= */
  useEffect(() => {
    if (!isOpen) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setMsg("");

        const res = await fetch(
          `http://localhost:5000/api/admin/staff/${encodeURIComponent(
            department
          )}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to load staff");

        setStaffList(data);
      } catch (err) {
        setMsg("❌ Failed to load staff list");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [isOpen, department]);

  if (!isOpen) return null;

  /* ================= ASSIGN HANDLER ================= */
  const handleAssign = async () => {
    if (!selectedStaffId) {
      setMsg("Please select a staff member");
      setStatusType("error");
      return;
    }

    try {
      setAssigning(true);
      setMsg("Assigning grievance...");
      setStatusType("info");

      const res = await fetch(
        `http://localhost:5000/api/grievances/assign/${grievanceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: selectedStaffId, // ✅ correct field
            adminId: adminId,          // ✅ dept admin ID
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (onAssigned) {
        onAssigned(`✅ Assigned to ${selectedStaffId}`, "success");
      }

      setSelectedStaffId("");
      onClose();
    } catch (err) {
      setMsg(err.message);
      setStatusType("error");
    } finally {
      setAssigning(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="assign-modal-overlay">
      <div className="assign-modal">
        <div className="assign-modal-header">
          <h3>Assign Staff – {department}</h3>
          <button className="assign-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <p className="assign-modal-subtitle">
          Select a staff member to handle this grievance.
        </p>

        {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

        {loading ? (
          <p>Loading staff...</p>
        ) : staffList.length === 0 ? (
          <div className="empty-state">
            <p>No staff found for this department.</p>
          </div>
        ) : (
          <div className="assign-staff-list">
            {staffList.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`staff-pill ${
                  selectedStaffId === s.id ? "selected" : ""
                }`}
                onClick={() => setSelectedStaffId(s.id)}
              >
                {s.fullName} ({s.id})
              </button>
            ))}
          </div>
        )}

        <div className="assign-modal-footer">
          <button
            className="assign-cancel-btn"
            onClick={onClose}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            className="assign-confirm-btn"
            onClick={handleAssign}
            disabled={assigning || !selectedStaffId}
          >
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignStaffPopup;
