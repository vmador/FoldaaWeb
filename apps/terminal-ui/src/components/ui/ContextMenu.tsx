"use client"
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export function ContextMenu({ x, y, onClose, children, className }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ x, y });

    // Adjust position to stay within viewport
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let nextX = x;
            let nextY = y;

            if (x + rect.width > window.innerWidth) {
                nextX = x - rect.width;
            }
            if (y + rect.height > window.innerHeight) {
                nextY = y - rect.height;
            }

            setCoords({ x: nextX, y: nextY });
        }
    }, [x, y]);

    // Close on click outside or escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            ref={menuRef}
            style={{
                position: "fixed",
                top: `${coords.y}px`,
                left: `${coords.x}px`,
                zIndex: 9999,
            }}
            className={clsx(
                "min-w-[160px] bg-background border border-border rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100",
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
}

export function ContextMenuItem({
    children,
    onClick,
    className,
    disabled = false
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}) {
    return (
        <div
            onClick={() => {
                if (!disabled && onClick) {
                    onClick();
                }
            }}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                disabled ? "text-muted-foreground cursor-not-allowed" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                className
            )}
        >
            {children}
        </div>
    );
}

export function ContextMenuSeparator() {
    return <div className="h-px bg-secondary my-1 mx-1" />;
}

export function ContextMenuSubmenu({
    label,
    children,
    disabled = false
}: {
    label: React.ReactNode;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={() => !disabled && setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div
                className={clsx(
                    "flex items-center justify-between gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                    disabled ? "text-muted-foreground cursor-not-allowed" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isOpen && "bg-secondary text-foreground"
                )}
            >
                {label}
                <span className="text-[10px] opacity-50">▶</span>
            </div>

            {isOpen && (
                 <div
                    className="absolute left-full top-0 ml-px min-w-[160px] bg-background border border-border rounded-lg shadow-xl py-1"
                    style={{ marginTop: "-5px" }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
