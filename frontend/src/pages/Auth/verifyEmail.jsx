import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner"; // For notifications
import axios from "axios";

const EmailVerify = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      setError("No email provided for verification. Please try registering again.");
      toast.error("No email provided for verification. Please try registering again.", {
        style: { background: "#F44336", color: "white" },
      });
      navigate("/pregister");
    }
    document.getElementById("otp-0")?.focus();
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (/^\d$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    const otpCode = otp.join("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in again.");
      toast.error("No authentication token found. Please log in again.", {
        style: { background: "#F44336", color: "white" },
      });
      navigate(`/verifyemail?email=${encodeURIComponent(email)}`);
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`, { email, code: otpCode }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        toast.success("Email verified successfully! Redirecting to profile creation page...", {
          style: { background: "#4CAF50", color: "white" },
        });
        navigate(`/profileform?email=${encodeURIComponent(email)}`);
      } else {
        throw new Error(response.data.message || "Invalid or expired verification code");
      }
    } catch (err) {
      console.log("Verification Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to verify email. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, {
        style: { background: "#F44336", color: "white" },
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before resending.`, {
        style: { background: "#F44336", color: "white" },
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Please log in again.", {
        style: { background: "#F44336", color: "white" },
      });
      navigate("/plogin");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`, { email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Verification code resent successfully!", {
        style: { background: "#4CAF50", color: "white" },
      });
      setResendCooldown(30); // 30-second cooldown
    } catch (err) {
      toast.error("Failed to resend code. Please try again.", {
        style: { background: "#F44336", color: "white" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <FaCheckCircle size={64} className="text-e-ride-purple mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Verify Your Email</h1>
          <p className="text-sm text-gray-600 mt-2">
            We’ve sent a 6-digit verification code to {email || "your email"}. Please enter it below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-semibold border border-e-ride-purple rounded-full focus:outline-none focus:ring-2 focus:ring-e-ride-purple focus:border-transparent"
                placeholder="0"
                required
                disabled={isSubmitting || loading}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center flex items-center justify-center gap-2">
              <FaTimesCircle className="inline" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading || otp.some((digit) => !digit)}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-e-ride-purple text-white font-semibold rounded-full hover:from-purple-600 hover:to-e-ride-purple focus:outline-none focus:ring-2 focus:ring-e-ride-purple transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || loading ? "Verifying..." : "VERIFY EMAIL"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Didn’t receive the code?{" "}
          <button
            onClick={resendOtp}
            className="text-e-ride-purple hover:underline font-medium"
            disabled={isSubmitting || loading || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default EmailVerify;