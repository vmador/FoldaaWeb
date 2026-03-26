"use client"
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: "left" | "right";
    side?: "top" | "bottom";
    className?: string;
}

export function Dropdown({ 
    trigger, 
    children, 
    align = "right", 
    side = "bottom",
    className 
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: side === "top" ? rect.top : rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    }, [side]);

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener("resize", updatePosition);
            window.addEventListener("scroll", updatePosition, true);
        }
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={triggerRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && typeof document !== "undefined" && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: "fixed",
                        top: coords 
                            ? (side === "top" ? 'auto' : `${coords.top + 8}px`)
                            : "0px",
                        bottom: coords && side === "top"
                            ? `${window.innerHeight - coords.top + 8}px`
                            : "auto",
                        zIndex: 9999,
                        // Handle alignment and collision detection
                        ...(align === "right"
                            ? {
                                left: "auto",
                                right: coords ? `${window.innerWidth - (coords.left + coords.width)}px` : "1rem"
                            }
                            : {
                                left: coords ? `${coords.left}px` : "1rem",
                                right: "auto"
                            }
                        ),
                        // Prevent flash before coordinates are calculated
                        visibility: coords ? "visible" : "hidden",
                    }}
                    className={clsx(
                        "min-w-[192px] bg-[#080808] border border-[#333336] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1 animate-in fade-in zoom-in-95 duration-100",
                        className
                    )}
                >
                    {children}
                </div>,
                document.body
            )}
        </div>
    );
}

export function DropdownItem({
    children,
    onClick,
    className,
    href
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    href?: string;
}) {
    const content = (
        <div
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm text-[#A0A0A0] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );

    if (href) {
        return <a href={href} className="block">{content}</a>;
    }

    return content;
}
