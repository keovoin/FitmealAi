import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router";

export function PaymentPending() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col p-6 h-full items-center justify-center text-center"
    >
      <GlassCard className="w-full flex flex-col items-center justify-center py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/10" />
        
        <motion.div 
          className="w-20 h-20 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 relative z-10"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        >
          <Clock size={36} />
        </motion.div>
        
        <h1 className="text-[24px] font-bold mb-3 relative z-10">Payment Under Review</h1>
        <p className="text-white/70 mb-8 relative z-10 leading-relaxed">
          We have received your transaction ID. We will activate your plan after verification (usually within 1-2 hours).
        </p>

        <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium px-4 py-2 rounded-full text-sm relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Status: Pending
        </div>
      </GlassCard>

      <div className="w-full mt-12">
        <PrimaryButton onClick={() => navigate("/home")}>
          Back to Home
        </PrimaryButton>
      </div>
    </motion.div>
  );
}
