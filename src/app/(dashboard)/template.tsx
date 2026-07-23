"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Subtle page-enter animation. A template (not a layout) re-mounts on every
 * navigation, so each page fades/slides in (~250ms, per DSD motion guidance).
 */
export default function DashboardTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
