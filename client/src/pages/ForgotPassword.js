import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { FiMail, FiLock, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

const STEPS = { EMAIL: "email", OTP: "otp", PASSWORD: "password", DONE: "done" };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const formatTimer = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  // Step 1 — Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email!");
      setStep(STEPS.OTP);
      setTimer(600); // 10 minutes
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("New OTP sent!");
      setOtp(["","","","","",""]);
      setTimer(600);
    } catch { toast.error("Failed to resend OTP"); }
    finally { setLoading(false); }
  };

  // Handle OTP input — auto advance
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (!value && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) return toast.error("Please enter the 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp: otpValue });
      setResetToken(data.resetToken);
      toast.success("OTP verified!");
      setStep(STEPS.PASSWORD);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords don't match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, resetToken, newPassword });
      toast.success("Password reset successfully!");
      setStep(STEPS.DONE);
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-black text-gray-900 mb-6">
            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center"><span className="text-white text-xs font-black">S</span></div>
            ShopMERN
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8">
          {["Email","Verify OTP","New Password"].map((label, i) => {
            const stepIndex = [STEPS.EMAIL, STEPS.OTP, STEPS.PASSWORD].indexOf(step);
            const done = i < stepIndex || step === STEPS.DONE;
            const active = i === stepIndex && step !== STEPS.DONE;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-green-500 text-white" : active ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-400"}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? "bg-green-400" : "bg-gray-200"}`}/>}
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Step 1 — Email */}
          {step === STEPS.EMAIL && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-1">Forgot Password?</h1>
              <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a 6-digit OTP</p>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-60">
                  {loading ? "Sending OTP..." : "Send OTP →"}
                </button>
                <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  <FiArrowLeft size={14}/> Back to login
                </Link>
              </form>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === STEPS.OTP && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-1">Enter OTP</h1>
              <p className="text-gray-500 text-sm mb-1">We sent a 6-digit code to</p>
              <p className="font-semibold text-gray-900 text-sm mb-6">{email}</p>

              {/* Timer */}
              <div className={`text-center mb-5 text-sm font-semibold ${timer < 60 ? "text-red-500" : "text-gray-600"}`}>
                {timer > 0 ? `⏱ Expires in ${formatTimer(timer)}` : <span className="text-red-500">OTP Expired</span>}
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* OTP inputs */}
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => inputRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => { if (e.key === "Backspace" && !digit && i > 0) inputRefs.current[i-1]?.focus(); }}
                      className={`w-12 h-14 text-center text-2xl font-black border-2 rounded-xl focus:outline-none transition-colors ${digit ? "border-gray-900 bg-gray-50" : "border-gray-200"} focus:border-gray-900`}/>
                  ))}
                </div>

                <button type="submit" disabled={loading || timer === 0 || otp.join("").length !== 6}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-60">
                  {loading ? "Verifying..." : "Verify OTP →"}
                </button>
              </form>

              <div className="mt-4 text-center">
                {timer === 0 ? (
                  <button onClick={handleResend} disabled={loading}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline mx-auto">
                    <FiRefreshCw size={13}/> Resend OTP
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">Didn't receive it? <button onClick={handleResend} disabled={loading || timer > 540} className="font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40">Resend</button></p>
                )}
              </div>
              <button onClick={() => setStep(STEPS.EMAIL)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mt-4 mx-auto">
                <FiArrowLeft size={13}/> Change email
              </button>
            </>
          )}

          {/* Step 3 — New password */}
          {step === STEPS.PASSWORD && (
            <>
              <h1 className="text-xl font-black text-gray-900 mb-1">New Password</h1>
              <p className="text-gray-500 text-sm mb-6">Choose a strong password</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                {[
                  { label: "New Password", value: newPassword, set: setNewPassword },
                  { label: "Confirm Password", value: confirmPassword, set: setConfirmPassword },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                      <input type="password" value={value} onChange={e => set(e.target.value)} placeholder="Min 6 characters" required minLength={6}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                    </div>
                  </div>
                ))}
                {/* Password strength */}
                {newPassword && (
                  <div className="space-y-1">
                    {[
                      { test: newPassword.length >= 6, label: "At least 6 characters" },
                      { test: /[A-Z]/.test(newPassword), label: "Uppercase letter" },
                      { test: /[0-9]/.test(newPassword), label: "Number" },
                      { test: /[^A-Za-z0-9]/.test(newPassword), label: "Special character" },
                    ].map(({ test, label }) => (
                      <div key={label} className={`flex items-center gap-2 text-xs ${test ? "text-green-600" : "text-gray-400"}`}>
                        <span>{test ? "✓" : "○"}</span>{label}
                      </div>
                    ))}
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-60">
                  {loading ? "Resetting..." : "Reset Password →"}
                </button>
              </form>
            </>
          )}

          {/* Step 4 — Done */}
          {step === STEPS.DONE && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-500 text-3xl">✓</span>
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">Password Reset!</h1>
              <p className="text-gray-500 text-sm mb-8">Your password has been reset successfully. Please login with your new password.</p>
              <button onClick={() => navigate("/login")}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors">
                Login Now →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}