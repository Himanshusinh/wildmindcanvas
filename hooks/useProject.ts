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

  // Initialize project when user is loaded
  useEffect(() => {
    const initProject = async () => {
      if (!currentUser) {
        setIsInitializing(false);
        return;
      }

      if (initRef.current) return; // Already initializing
      if (projectId) {
        setIsInitializing(false);
        return; // Already initialized
      }

      initRef.current = true;

      // 1. Check URL search params first (Priority)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlProjectId = params.get('projectId');

        if (urlProjectId) {
          if (urlProjectId === 'new') {
            // Handle 'new' case - show selector
            setIsInitializing(false);
            setShowProjectSelector(true);
            initRef.current = false;
            return;
          }

          try {
            const project = await getProject(urlProjectId);
            if (project) {
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
            setProjectId(savedProjectId);
            setProjectName(project.name);
            setIsInitializing(false);
            initRef.current = false; // Reset for future use
            return;
          }
        } catch (error) {
          console.error('Failed to load project:', error);
          // Project doesn't exist, show project selector
        }
      }

      // Show project selector to let user choose or create
      setIsInitializing(false);
      setShowProjectSelector(true);
      initRef.current = false; // Reset after showing selector
    };

    initProject();
  }, [currentUser]); // Only depend on currentUser, not projectId

  const handleProjectSelect = (project: CanvasProject) => {
    setProjectId(project.id);
    setProjectName(project.name);
    setShowProjectSelector(false);
    localStorage.setItem('canvas-project-id', project.id);
    localStorage.setItem('canvas-project-name', project.name);

    // Update URL without reloading page
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('projectId', project.id);
      window.history.pushState({}, '', newUrl.toString());
    }
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

