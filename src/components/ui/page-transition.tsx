import { HTMLMotionProps, motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export type PageTransitionVariant =
  | "fade"
  | "slide-up"
  | "slide-right"
  | "slide-left"
  | "zoom"
  | "parallax"
  | "flip";

interface PageTransitionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: PageTransitionVariant;
  duration?: number;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "slide-up": {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  },
  "slide-right": {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
  },
  "slide-left": {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  parallax: {
    initial: { opacity: 0, y: 40, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -40, scale: 0.98 },
  },
  flip: {
    initial: { opacity: 0, rotateX: 90 },
    animate: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: -90 },
  },
};

export function PageTransition({
  children,
  variant = "fade",
  duration = 0.4,
  className,
  ...props
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const currentVariant = shouldReduceMotion ? variants.fade : variants[variant];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={currentVariant}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
