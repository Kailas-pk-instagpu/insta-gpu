import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

const iosEase = [0.32, 0.72, 0, 1] as const;

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: iosEase }}
      style={{ willChange: "transform, opacity" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

