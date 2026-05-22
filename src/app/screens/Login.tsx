import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";
import { Mail, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";

type AuthMode = "email" | "phone";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.77M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("email");
  const [value, setValue] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/onboarding/goal");
    }, 1200);
  }

  function handleSocial() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/onboarding/goal");
    }, 800);
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-[#8F5CFF]/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[60px] right-[-60px] w-[200px] h-[200px] bg-[#4F8CFF]/20 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 flex flex-col p-6 pt-16 gap-6 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-[72px] h-[72px] bg-gradient-to-tr from-[#4F8CFF] to-[#8F5CFF] rounded-[20px] shadow-[0_0_40px_rgba(143,92,255,0.5)] flex items-center justify-center mb-5 border border-white/20">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9" />
              <path d="m8 17 4 4 4-4" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold mb-1">Welcome back</h1>
          <p className="text-white/60 text-[15px]">Sign in to continue your wellness journey</p>
        </div>

        <GlassCard className="flex flex-col gap-4">
          {/* Social buttons */}
          <button
            onClick={handleSocial}
            className="flex items-center justify-center gap-3 h-[52px] rounded-[14px] bg-white text-gray-800 font-semibold text-sm transition-all active:scale-[0.98] shadow-md hover:bg-gray-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <button
            onClick={handleSocial}
            className="flex items-center justify-center gap-3 h-[52px] rounded-[14px] bg-black border border-white/10 text-white font-semibold text-sm transition-all active:scale-[0.98] hover:bg-white/5"
          >
            <AppleIcon />
            Continue with Apple
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-white/40 text-xs font-medium">or sign in with</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* Email / Phone toggle */}
          <div className="flex bg-white/[0.08] p-1 rounded-[14px] border border-white/10">
            {(["email", "phone"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setValue(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-[10px] transition-all duration-200 ${
                  mode === m
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                {m === "email" ? <Mail size={14} /> : <Phone size={14} />}
                {m === "email" ? "Email" : "Phone"}
              </button>
            ))}
          </div>

          {/* Input */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-3"
            >
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  {mode === "email" ? <Mail size={16} /> : <Phone size={16} />}
                </div>
                <input
                  type={mode === "email" ? "email" : "tel"}
                  placeholder={mode === "email" ? "you@example.com" : "+1 (555) 000-0000"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-[14px] pl-10 pr-4 py-4 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-[#8F5CFF] focus:bg-white/8 transition-all"
                />
              </div>

              {mode === "email" && (
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-[14px] px-4 pr-12 py-4 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-[#8F5CFF] focus:bg-white/8 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {mode === "email" && (
            <button className="text-right text-xs text-[#8F5CFF] font-medium -mt-1 hover:text-[#4F8CFF] transition-colors">
              Forgot password?
            </button>
          )}

          <PrimaryButton loading={loading} onClick={handleContinue} className="mt-1">
            {loading ? "" : (
              <span className="flex items-center gap-2">
                {mode === "email" ? "Sign In" : "Send OTP"}
                <ArrowRight size={16} />
              </span>
            )}
          </PrimaryButton>
        </GlassCard>

        {/* Sign up nudge */}
        <p className="text-center text-sm text-white/50">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/onboarding/goal")}
            className="text-[#8F5CFF] font-semibold hover:text-[#4F8CFF] transition-colors"
          >
            Get started free
          </button>
        </p>

        {/* Terms */}
        <p className="text-center text-[11px] text-white/30 leading-relaxed px-4">
          By continuing you agree to our{" "}
          <span className="text-white/50 underline underline-offset-2">Terms of Service</span> and{" "}
          <span className="text-white/50 underline underline-offset-2">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}
