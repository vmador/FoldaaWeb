"use client"
import Link from "next/link";

export function AuthFooter() {
    return (
        <footer className="mt-12 text-center font-mono text-[10px] tracking-tight uppercase opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center justify-center gap-4 mb-2">
                <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
                <span className="opacity-20">•</span>
                <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            </div>
            <p>© {new Date().getFullYear()} Foldaa. All rights reserved.</p>
        </footer>
    );
}
