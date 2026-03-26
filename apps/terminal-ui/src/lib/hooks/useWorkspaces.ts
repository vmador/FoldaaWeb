"use client"
import { useWorkspaces } from "@/lib/contexts/WorkspaceContext";

export function useActiveWorkspace() {
    return useWorkspaces();
}
