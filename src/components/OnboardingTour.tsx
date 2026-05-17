import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Target, Zap, Shield, ChevronRight, X, Sparkles, Globe, UserCheck } from "lucide-react";
import { cn } from "../lib/utils";

const onboardingSteps = [
  {
    id: "welcome",
    title: "The Freedom Wheels™ Ecosystem",
    desc: "A decentralized infrastructure for sovereign wealth. You are now authorized to orchestrate a network of autonomous income engines via the Sovereign Core.",
    icon: <Sparkles className="w-12 h-12 text-accent-gold" />,
    color: "accent-gold"
  },
  {
    id: "engines",
    title: "Autonomous Income Engines",
    desc: "Self-sustaining revenue machines. Once deployed, these engines perform data synthesis, content delivery, and sales conversion 24/7 with zero manual overhead.",
    icon: <Zap className="w-12 h-12 text-accent-blue" />,
    color: "accent-blue"
  },
  {
    id: "automation",
    title: "Neural Automation Hub",
    desc: "The 'brain' of your enterprise. Neural automation handles complex logic, customer interaction, and payment processing using AI-driven feedback loops.",
    icon: <Cpu className="w-12 h-12 text-accent-gold" />,
    color: "accent-gold"
  },
  {
    id: "leads",
    title: "Lead Intelligence",
    desc: "Surgically monitor every inbound lead. Our AI scores intent integrity and identifies high-probability conversion events across the grid.",
    icon: <Target className="w-12 h-12 text-accent-blue" />,
    color: "accent-blue"
  },
  {
    id: "ready",
    title: "Sovereign Status: Active",
    desc: "Optimization complete. Your profile is authorized for unlimited engine deployments. Go forth and manifest your financial sovereignty.",
    icon: <UserCheck className="w-12 h-12 text-emerald-500" />,
    color: "emerald-500"
  }
];

export default function OnboardingTour({ isOpen: initialIsOpen, onComplete }: { isOpen: boolean, onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  useEffect(() => {
    setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  if (!isOpen) return null;

  const step = onboardingSteps[currentStep];
  const isLast = currentStep === onboardingSteps.length - 1;

  const next = () => {
    if (isLast) {
      setIsOpen(false);
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const close = () => {
    setIsOpen(false);
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/80 backdrop-blur-xl p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="max-w-xl w-full bg-surface border border-white/10 rounded-2xl p-10 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
        >
          {/* Background Decorative Element */}
          <div className={cn("absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 transition-colors duration-700", 
            step.color === 'accent-blue' ? 'bg-accent-blue' : 
            step.color === 'accent-gold' ? 'bg-accent-gold' : 'bg-emerald-500'
          )} />
          
          <button 
            onClick={close}
            className="absolute top-6 right-6 p-2 text-text-dim hover:text-text-main transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10">
             <motion.div
               key={step.id + "_icon"}
               initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
               animate={{ scale: 1, opacity: 1, rotate: 0 }}
               className="mb-8 flex justify-center"
             >
               <div className={cn("inline-flex p-6 rounded-3xl bg-bg border border-white/5 shadow-2xl", 
                 step.color === 'accent-blue' ? 'shadow-accent-blue/10 border-accent-blue/20' : 
                 step.color === 'accent-gold' ? 'shadow-accent-gold/10 border-accent-gold/20' : 'shadow-emerald-500/10 border-emerald-500/20'
               )}>
                 {step.icon}
               </div>
             </motion.div>

             <motion.div
               key={step.id + "_text"}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-center"
             >
               <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-text-main">
                 {step.title}
               </h3>
               <p className="text-text-dim text-lg leading-relaxed mb-10 max-w-sm mx-auto">
                 {step.desc}
               </p>
             </motion.div>

             <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={next}
                  className={cn("w-full py-5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 group relative overflow-hidden",
                    step.color === 'accent-blue' ? 'bg-accent-blue text-bg hover:shadow-[0_0_30px_rgba(0,242,255,0.4)]' : 
                    step.color === 'accent-gold' ? 'bg-accent-gold text-bg hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 text-bg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                  )}
                >
                   {isLast ? 'Enter the Ecosystem' : 'Initialize Command'}
                   <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex gap-2">
                   {onboardingSteps.map((_, i) => (
                     <div 
                       key={i} 
                       className={cn("h-1 rounded-full transition-all duration-300", 
                         i === currentStep ? "w-8 bg-text-main" : "w-2 bg-text-dim/30"
                       )} 
                     />
                   ))}
                </div>
             </div>
          </div>

          <div className="mt-12 text-center">
             <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest opacity-50">
               Neural_Authentication_Service :: v4.0.2
             </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
