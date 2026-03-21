"use client"
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: "left" | "right";
    className?: string;
}

export function Dropdown({ trigger, children, align = "right", className }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    useEffect(() => {
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
                        position: "absolute",
                        top: `${coords.top + 8}px`,
                        // Handle alignment and collision detection
                        ...(align === "right"
                            ? {
                                left: "auto",
                                right: `${window.innerWidth - (coords.left + coords.width)}px`
                            }
                            : {
                                left: `${coords.left}px`,
                                right: "auto"
                            }
                        )
                    }}
                    className={clsx(
                        "z-[9999] min-w-[192px] bg-[#1C1C1E] border border-[#333336] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1 animate-in fade-in zoom-in-95 duration-100",
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
                "flex items-center gap-2 px-3 py-2 text-sm text-[#A0A0A0] hover:bg-[#2A2A2E] hover:text-white transition-colors cursor-pointer",
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
