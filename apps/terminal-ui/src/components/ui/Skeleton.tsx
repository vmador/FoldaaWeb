"use client"
import clsx from "clsx";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div 
            className={clsx(
                "animate-pulse bg-neutral-200 rounded",
                className
            )}
        />
    );
}
