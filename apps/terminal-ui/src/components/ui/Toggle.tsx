"use client"
import React from "react"
import { motion } from "framer-motion"
import clsx from "clsx"

interface ToggleProps {
    className?: string
    checked: boolean
    onChange: () => void
    disabled?: boolean
}

export const Toggle: React.FC<ToggleProps> = ({ 
    className, 
    checked, 
    onChange, 
    disabled = false 
}) => {
    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.nativeEvent.stopImmediatePropagation()
                if (!disabled) onChange()
            }}
            className={clsx(
                "w-10 h-5.5 rounded-full relative transition-colors duration-200 border",
                className
            )}
            animate={{
                backgroundColor: checked ? "var(--theme-brand-500)" : "var(--neutral-100)",
                borderColor: checked ? "var(--theme-brand-600)" : "var(--neutral-300)",
            }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className={clsx(
                    "absolute top-1 left-1 w-3.5 h-3.5 rounded-full shadow-sm",
                    checked ? "bg-white" : "bg-neutral-900"
                )}
                animate={{
                    x: checked ? 18 : 0,
                    scale: checked ? 1.1 : 1,
                    boxShadow: checked 
                        ? "0 0 10px rgba(255, 255, 255, 0.4)" 
                        : "0 0 0px rgba(0, 0, 0, 0)"
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                }}
            />
        </motion.button>
    )
}
