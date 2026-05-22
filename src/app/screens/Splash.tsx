import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

export function Splash() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.9 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-[120px] h-[120px] bg-gradient-to-tr from-[#4F8CFF] to-[#8F5CFF] rounded-[32px] mx-auto shadow-[0_0_80px_rgba(79,140,255,0.6)] flex items-center justify-center backdrop-blur-3xl border-2 border-white/20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9" />
            <path d="m8 17 4 4 4-4" />
          </svg>
        </div>
        <h1 className="text-[34px] font-bold mt-8 mb-2 tracking-tight">VitaGlass AI</h1>
        <p className="text-[16px] text-white/70 font-medium tracking-wide uppercase">Meal. Move. Improve.</p>
      </motion.div>
    </div>
  );
}
