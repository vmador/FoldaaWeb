"use client"
import { useProjectData, Project, Folder } from "@/lib/contexts/ProjectContext";

export type { Project, Folder };

export function useProjects() {
    const { projects, loading, error, mutateProjects } = useProjectData();
    return { projects, loading, error, mutate: mutateProjects };
}

export function useFolders() {
    const { 
        folders, 
        loading, 
        error, 
        createFolder, 
        updateFolder, 
        deleteFolder, 
        moveProjectToFolder,
        mutateFolders
    } = useProjectData();

    return { 
        folders, 
        loading, 
        error, 
        createFolder, 
        updateFolder, 
        deleteFolder, 
        moveProjectToFolder, 
        mutate: mutateFolders 
    };
}
