import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

/** Fade + slight slide-up applied to every routed page. */
export const PageTransition = ({ children }: PropsWithChildren) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)