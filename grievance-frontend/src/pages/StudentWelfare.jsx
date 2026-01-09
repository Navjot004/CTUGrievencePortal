import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Dashboard.css";

function StudentWelfare() {
  const navigate = useNavigate();
  const role = localStorage.getItem("grievance_role");
  const userId = localStorage.getItem("grievance_id"); // 8-digit

  const [formData, setFormData] = useState({
    name: "",
    regid: userId || "",
    email: "",
    phone: "",
    program: "", // 🔥 STUDENT COURSE
    message: "",
  });

  const [attachment, setAttachment] = useState(null);
  const [msg, setMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔒 Route protection
  useEffect(() => {
    if (!role || role !== "student") navigate("/");
  }, [role, navigate]);

  // ✅ Fetch student profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/user/${userId}`
        );
        const data = await res.json();

        if (res.ok) {
          setFormData((prev) => ({
            ...prev,
            name: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            program: data.department || data.program || "", // 🔥 IMPORTANT
          }));
        }
      } catch (err) {
        console.error("User fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, message: e.target.value });
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setMsg("Submitting grievance...");
  setStatusType("info");

  const payload = new FormData();
  payload.append("userId", userId);
  payload.append("name", formData.name);
  payload.append("regid", formData.regid);
  payload.append("email", formData.email);
  payload.append("phone", formData.phone);

  // ✅ BACKEND FINAL FIELDS
  payload.append("studentProgram", formData.program); // B.Sc Animation
  payload.append("category", "Student Welfare");

  payload.append("message", formData.message);
  if (attachment) payload.append("attachment", attachment);

  try {
    const res = await fetch(
      "http://localhost:5000/api/grievances/submit",
      {
        method: "POST",
        body: payload,
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    setMsg("✅ Grievance submitted successfully");
    setStatusType("success");
    setFormData((prev) => ({ ...prev, message: "" }));
    setAttachment(null);

    const fileInput = document.getElementById("fileInput");
    if (fileInput) fileInput.value = "";
  } catch (err) {
    setMsg(`❌ ${err.message}`);
    setStatusType("error");
  }
};



  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <p>Welcome, {formData.name || userId}</p>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="navbar">
        <ul>
          <li><Link to="/student/dashboard">Dashboard</Link></li>
          <li className="active"><Link to="/student/welfare">Student Welfare</Link></li>
          <li><Link to="/student/admission">Admission</Link></li>
          <li><Link to="/student/section">Student Section</Link></li>
          <li><Link to="/student/accounts">Accounts</Link></li>
          <li><Link to="/student/examination">Examination</Link></li>
          <li><Link to="/student/department">Department</Link></li>
        </ul>
      </nav>

      <main className="dashboard-body">
        <div className="card">
          <h2>Submit Student Welfare Grievance</h2>

          {loading ? (
            <p>Loading your details...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {msg && <div className={`alert-box ${statusType}`}>{msg}</div>}

              <div className="form-row">
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className="read-only-input"
                  />
                </div>
                <div className="input-group">
                  <label>Registration ID</label>
                  <input
                    type="text"
                    name="regid"
                    value={formData.regid}
                    readOnly
                    className="read-only-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="read-only-input"
                  />
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    readOnly
                    className="read-only-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Program / Course</label>
                <input
                  type="text"
                  name="program"
                  value={formData.program}
                  readOnly
                  className="read-only-input"
                />
              </div>

              <div className="input-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Details..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Attach Document (Optional)</label>
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="file-input"
                />
              </div>

              <button type="submit" className="submit-btn">
                Submit Grievance
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentWelfare;
