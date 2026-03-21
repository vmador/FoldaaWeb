"use client"
import React, { createContext, useContext, useState, useEffect } from "react";

interface UIContextType {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    isCreateModalOpen: boolean;
    setCreateModalOpen: (open: boolean) => void;
    toasts: any[];
    addToast: (message: string, type?: 'success' | 'error' | 'info', persistent?: boolean) => void;
    removeToast: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);

    // Initialize from localStorage if available
    useEffect(() => {
        const saved = localStorage.getItem("sidebar_open");
        if (saved !== null) {
            setSidebarOpen(saved === "true");
        }
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(prev => {
            const newState = !prev;
            localStorage.setItem("sidebar_open", String(newState));
            return newState;
        });
    };
    
    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success', persistent = false) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, persistent }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <UIContext.Provider value={{ 
            isSidebarOpen, 
            toggleSidebar, 
            setSidebarOpen,
            isCreateModalOpen,
            setCreateModalOpen,
            toasts,
            addToast,
            removeToast
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
