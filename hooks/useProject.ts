import { useState, useEffect, useRef } from 'react';
import { getProject } from '@/lib/canvasApi';
import { CanvasProject } from '@/lib/canvasApi';

interface UseProjectOptions {
  currentUser: { uid: string; username: string; email: string; credits?: number } | null;
}

interface UseProjectReturn {
  projectId: string | null;
  projectName: string;
  showProjectSelector: boolean;
  isInitializing: boolean;
  setProjectId: React.Dispatch<React.SetStateAction<string | null>>;
  setProjectName: React.Dispatch<React.SetStateAction<string>>;
  setShowProjectSelector: React.Dispatch<React.SetStateAction<boolean>>;
  handleProjectSelect: (project: CanvasProject) => void;
}

/**
 * Custom hook for managing project state and initialization
 */
export function useProject({ currentUser }: UseProjectOptions): UseProjectReturn {
  const [projectName, setProjectName] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canvas-project-name') || 'Untitled';
    }
    return 'Untitled';
  });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initRef = useRef(false); // Prevent multiple initializations
  const isSelectingRef = useRef(false); // Track if we're in the middle of selecting a project

  // Initialize project when user is loaded
  useEffect(() => {
    const initProject = async () => {
      if (!currentUser) {
        setIsInitializing(false);
        return;
      }

      // Don't initialize if we're in the middle of selecting a project
      if (isSelectingRef.current) {
        console.log('[useProject] Skipping initialization - project selection in progress');
        return;
      }

      if (initRef.current) return; // Already initializing
      if (projectId) {
        setIsInitializing(false);
        initRef.current = true; // Mark as initialized
        return; // Already initialized
      }

      initRef.current = true;

      // 1. Check URL search params first (Priority)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlProjectId = params.get('projectId');

        if (urlProjectId) {
          if (urlProjectId === 'new') {
            // Handle 'new' case - clear localStorage and show selector
            console.log('[useProject] URL has projectId=new, clearing localStorage and showing selector');
            localStorage.removeItem('canvas-project-id');
            localStorage.removeItem('canvas-project-name');
            setIsInitializing(false);
            setShowProjectSelector(true);
            initRef.current = false;
            return;
          }

          try {
            const project = await getProject(urlProjectId);
            if (project) {
              console.log('[useProject] Loaded project from URL:', { id: project.id, name: project.name });
              setProjectId(project.id);
              setProjectName(project.name);
              setIsInitializing(false);
              initRef.current = false;
              // Update local storage to match URL
              localStorage.setItem('canvas-project-id', project.id);
              localStorage.setItem('canvas-project-name', project.name);
              return;
            }
          } catch (error) {
            console.error('Failed to load project from URL:', error);
            // Fall through to local storage if URL project fails
          }
        }
      }

      // 2. Check if we have a project ID in localStorage
      const savedProjectId = localStorage.getItem('canvas-project-id');
      if (savedProjectId) {
        // Try to load existing project
        try {
          const project = await getProject(savedProjectId);
          if (project) {
            console.log('[useProject] Loaded project from localStorage:', { id: project.id, name: project.name });
            setProjectId(savedProjectId);
            setProjectName(project.name);
            setIsInitializing(false);
            initRef.current = false; // Reset for future use
            return;
          }
        } catch (error) {
          console.error('Failed to load project from localStorage:', error);
          // Project doesn't exist, clear localStorage and show project selector
          localStorage.removeItem('canvas-project-id');
          localStorage.removeItem('canvas-project-name');
        }
      }

      // Show project selector to let user choose or create
      console.log('[useProject] No project found, showing selector');
      setIsInitializing(false);
      setShowProjectSelector(true);
      initRef.current = false; // Reset after showing selector
    };

    initProject();
  }, [currentUser]); // Only depend on currentUser, not projectId

  const handleProjectSelect = (project: CanvasProject) => {
    console.log('[useProject] Selecting project:', { id: project.id, name: project.name });
    
    // Mark that we're selecting a project to prevent re-initialization
    isSelectingRef.current = true;
    
    // Clear any existing project state first
    setProjectId(null);
    
    // Clear localStorage first to ensure clean state
    localStorage.removeItem('canvas-project-id');
    localStorage.removeItem('canvas-project-name');
    
    // Use setTimeout to ensure state clears before setting new project
    setTimeout(() => {
      console.log('[useProject] Setting new project after clear:', { id: project.id, name: project.name });
      
      // Set the new project
      setProjectId(project.id);
      setProjectName(project.name);
      setShowProjectSelector(false);
      
      // Set localStorage with new project
      localStorage.setItem('canvas-project-id', project.id);
      localStorage.setItem('canvas-project-name', project.name);

      // Update URL without reloading page - use replaceState to avoid back button issues
      if (typeof window !== 'undefined') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('projectId', project.id);
        window.history.replaceState({}, '', newUrl.toString());
        console.log('[useProject] Updated URL with projectId:', project.id);
      }
      
      // Mark initialization as complete and allow future initializations
      initRef.current = true;
      
      // Clear the selecting flag after a delay to allow state to settle
      setTimeout(() => {
        isSelectingRef.current = false;
        console.log('[useProject] Project selection complete, initialization can run again if needed');
      }, 200);
    }, 50); // Small delay to ensure state is cleared
  };

  return {
    projectId,
    projectName,
    showProjectSelector,
    isInitializing,
    setProjectId,
    setProjectName,
    setShowProjectSelector,
    handleProjectSelect,
  };
}

