import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard, PrimaryButton } from "../components/ui";
import { ChevronLeft, Upload, Copy } from "lucide-react";
import { useNavigate } from "react-router";

export function ABAPayment() {
  const navigate = useNavigate();
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!txnId) return;
    setLoading(true);
    setTimeout(() => {
      navigate("/payment/pending");
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col p-6 pt-12 h-full gap-6 overflow-y-auto no-scrollbar pb-12"
    >
      <header className="flex items-center gap-4 relative">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center -ml-2">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[24px] font-bold">ABA Payment</h1>
      </header>

      <GlassCard className="flex items-center justify-between !p-4 bg-[#0F172A]/50">
        <div>
          <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Plan</div>
          <div className="font-bold text-amber-400">VitaGlass Gold</div>
        </div>
        <div className="text-right">
          <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Amount</div>
          <div className="font-bold">$4.99</div>
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col items-center justify-center py-8 relative overflow-hidden group">
        <motion.div 
          className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />
        <div className="w-48 h-48 bg-white rounded-2xl p-2 mb-4 relative z-10 shadow-2xl">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://pay.ababank.com/test" alt="QR Code" className="w-full h-full" />
        </div>
        <div className="text-lg font-bold mb-1 relative z-10">VitaGlass AI</div>
        <div className="flex items-center gap-2 text-sm text-white/60 relative z-10 bg-white/5 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
          ID: 123-456-789 <Copy size={12} />
        </div>
      </GlassCard>

      <div className="text-center text-sm text-white/70">
        Scan this QR with ABA app, then submit the transaction ID below.
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Transaction ID (e.g. 123456789)" 
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-[16px] px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#4F8CFF] focus:bg-white/10 transition-colors"
        />
        
        <button className="w-full bg-white/5 border border-dashed border-white/20 hover:border-white/40 rounded-[16px] px-4 py-4 text-white/70 flex items-center justify-center gap-2 transition-colors">
          <Upload size={18} /> Upload Screenshot (Optional)
        </button>
      </div>

      <div className="mt-auto pt-8">
        <PrimaryButton 
          loading={loading} 
          disabled={!txnId}
          onClick={handleSubmit}
        >
          Submit for Approval
        </PrimaryButton>
      </div>
    </motion.div>
  );
}
