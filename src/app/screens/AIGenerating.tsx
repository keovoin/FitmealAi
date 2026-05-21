import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { SecondaryGlassButton } from "../components/ui";

export function AIGenerating() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center p-6 text-center bg-black/40 backdrop-blur-md">
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="relative w-32 h-32 mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#4F8CFF] to-[#8F5CFF] rounded-[32px] shadow-[0_0_80px_rgba(79,140,255,0.6)] flex items-center justify-center backdrop-blur-3xl border border-white/40 animate-spin-slow">
        </div>
        <div className="absolute inset-2 bg-black/60 rounded-[28px] backdrop-blur-xl flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#generating-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            <defs>
              <linearGradient id="generating-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4F8CFF" />
                <stop offset="1" stopColor="#8F5CFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Creating your perfect plan...</h2>
      <p className="text-white/60 mb-12">Analyzing your goals and preferences</p>

      <div className="w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative isolate">
            <motion.div 
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ translateX: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: i * 0.2 }}
            />
          </div>
        ))}
      </div>

      <div className="mt-auto w-full pt-8">
        <SecondaryGlassButton onClick={() => navigate("/home")}>
          Cancel
        </SecondaryGlassButton>
      </div>
    </div>
  );
}
