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

  // Deadline states
  const [grievanceCreatedAt, setGrievanceCreatedAt] = useState(null);
  const [deadline, setDeadline] = useState("");


  /* ================= FETCH STAFF ================= */
  useEffect(() => {
    if (!isOpen) return;

    const fetchStaffAndGrievance = async () => {
      try {
        setLoading(true);
        setMsg("");

        // Fetch staff list
        const staffRes = await fetch(
          `http://localhost:5000/api/admin/staff/${encodeURIComponent(
            department
          )}`
        );
        const staffData = await staffRes.json();
        if (!staffRes.ok) throw new Error(staffData.message || "Failed to load staff");
        setStaffList(staffData);

        // Fetch grievance detail to read createdAt and existing deadline
        if (grievanceId) {
          const gRes = await fetch(`http://localhost:5000/api/grievances/detail/${grievanceId}`);
          const gData = await gRes.json();
          if (gRes.ok) {
            if (gData.createdAt) setGrievanceCreatedAt(new Date(gData.createdAt));
            if (gData.deadlineDate) {
              const d = new Date(gData.deadlineDate);
              // Format for date input yyyy-mm-dd
              const iso = d.toISOString().slice(0, 10);
              setDeadline(iso);
            } else if (gData.createdAt) {
              // Default deadline = createdAt by default
              const iso = new Date(gData.createdAt).toISOString().slice(0, 10);
              setDeadline(iso);
            }
          }
        }

      } catch (err) {
        setMsg("❌ Failed to load staff list or grievance data");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffAndGrievance();
  }, [isOpen, department, grievanceId]);

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
            deadline: deadline || null
          }),
        }
      );

      const data = await res.json();
      console.log("Assign response:", data);
      if (!res.ok) throw new Error(data.message);

      if (onAssigned) {
        const msgText = deadline ? `✅ Assigned to ${selectedStaffId} (Deadline: ${deadline})` : `✅ Assigned to ${selectedStaffId}`;
        onAssigned(msgText, "success");
      }

      setSelectedStaffId("");
      setDeadline("");
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
          <div>
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

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Deadline</label>
              <input
                type="date"
                value={deadline}
                min={grievanceCreatedAt ? grievanceCreatedAt.toISOString().slice(0,10) : undefined}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d0d5dd' }}
              />
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 6 }}>
                Select a deadline on or after the grievance creation date {grievanceCreatedAt ? `(${grievanceCreatedAt.toLocaleDateString()})` : ''}.
              </div>
            </div>
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
