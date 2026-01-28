import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ ADD THIS

const ForgotPassword = () => {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // ✅ ADD THIS

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { phone }
      );

      setMessage(res.data.message);

      // ✅ store phone as backup (recommended)
      localStorage.setItem("reset_phone", phone);

      // ✅ navigate with phone
      setTimeout(() => {
        navigate("/reset-password", {
          state: { phone },
        });
      }, 1200);

    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>

      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          type="text"
          placeholder="Enter registered phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="off"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default ForgotPassword;
