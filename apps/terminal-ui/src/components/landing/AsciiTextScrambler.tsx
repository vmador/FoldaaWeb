"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SCRAMBLE_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface AsciiTextScramblerProps {
  texts: string[];
  interval?: number;
}

export const AsciiTextScrambler = ({ texts, interval = 5000 }: AsciiTextScramblerProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [index, texts, interval]);

  return (
    <div className="relative h-24 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p 
          key={index}
          initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl font-bold tracking-tighter text-white text-center leading-[1.1] absolute inset-0 flex items-center justify-center"
        >
          {texts[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
