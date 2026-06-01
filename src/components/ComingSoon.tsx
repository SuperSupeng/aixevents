import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket } from 'lucide-react';

interface ComingSoonProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  isOpen,
  onClose,
  feature = '这个功能'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Decorative Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all z-20"
          >
            <X size={20} />
          </button>

          <div className="p-12 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
              <Rocket size={40} className="text-primary" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-serif italic text-white mb-4 leading-tight">
              即将上线
            </h2>

            {/* Description */}
            <p className="text-white/60 mb-8 leading-relaxed text-sm">
              {feature} 正在开发中，我们会尽快把它做成可用的体验。
            </p>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-medium transition-all"
            >
              知道了
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ComingSoon;
