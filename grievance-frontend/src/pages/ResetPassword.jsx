import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ ADD

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Auto-read phone from router state or localStorage
  const [phone, setPhone] = useState(
    location.state?.phone || localStorage.getItem("reset_phone") || ""
  );
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        { phone, otp, newPassword }
      );

      setMessage(res.data.message);

      // ✅ cleanup
      localStorage.removeItem("reset_phone");

      setTimeout(() => {
        navigate("/"); // back to login
      }, 1500);

    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>

      <form onSubmit={handleReset} autoComplete="off">
        {/* ✅ Phone auto-filled & locked */}
        <input
          type="text"
          value={phone}
          disabled
          autoComplete="off"
        />

        <input
          type="text"
          placeholder="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          autoComplete="one-time-code"
          name="otp"
          required
        />

        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          name="new-password"
          required
        />

        <button type="submit">Reset Password</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default ResetPassword;
