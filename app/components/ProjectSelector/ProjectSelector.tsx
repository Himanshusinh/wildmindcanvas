'use client';

import { useState, useEffect, useRef } from 'react';
import { listProjects, createProject, CanvasProject } from '@/lib/canvasApi';

interface ProjectSelectorProps {
  onProjectSelect: (project: CanvasProject) => void;
  currentProjectId?: string | null;
}

export function ProjectSelector({ onProjectSelect, currentProjectId }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Untitled');
  const creatingRef = useRef(false); // Prevent duplicate creation requests
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const userProjects = await listProjects(20);
      setProjects(userProjects);

      // If no current project and we have projects, select the first one
      if (!currentProjectId && userProjects.length > 0) {
        onProjectSelect(userProjects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      
      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('Authentication required')) {
        // Check if we're on a different subdomain and might need to log in
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const isStudioSubdomain = hostname.includes('studio.wildmindai.com') || hostname.includes('studio');
        
        if (isStudioSubdomain) {
          console.warn('[ProjectSelector] Authentication failed - user may need to log in on main site first', {
            hostname,
            error: error.message,
          });
          // Don't show error to user - they might be able to continue with a new project
          // The error is logged for debugging
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Project name is required');
      return;
    }

    // Prevent duplicate requests
    if (creatingRef.current || isCreating) {
      return;
    }

    try {
      creatingRef.current = true;
      setIsCreating(true);
      const project = await createProject(newProjectName.trim());
      setProjects(prev => [project, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('Untitled');
      onProjectSelect(project);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      alert(error.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
      creatingRef.current = false;
    }
  };

  const bgColor = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#e5e7eb' : '#1f2937';
  const subTextColor = isDark ? '#9ca3af' : '#4b5563';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const hoverBorderColor = isDark ? '#3b82f6' : '#3b82f6';
  const activeBorderColor = isDark ? '#2563eb' : '#2563eb';
  const activeBgColor = isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff';
  const inputBg = isDark ? '#374151' : '#ffffff';
  const inputBorder = isDark ? '#4b5563' : '#d1d5db';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[20002]">
        <div className="rounded-lg p-6" style={{ backgroundColor: bgColor }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: subTextColor }}>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (showCreateModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[20002]">
        <div className="rounded-lg p-6 w-96" style={{ backgroundColor: bgColor, color: textColor }}>
          <h2 className="text-xl font-bold mb-4">Create New Project</h2>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: inputBg,
              borderColor: inputBorder,
              borderWidth: '1px',
              color: textColor
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateProject();
              } else if (e.key === 'Escape') {
                setShowCreateModal(false);
              }
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 hover:opacity-80"
              style={{ color: subTextColor }}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={isCreating || !newProjectName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[20002]">
      <div className="rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Select Project</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="mb-4" style={{ color: subTextColor }}>No projects found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className="p-4 border-2 rounded-lg cursor-pointer transition-colors"
                style={{
                  borderColor: currentProjectId === project.id ? activeBorderColor : borderColor,
                  backgroundColor: currentProjectId === project.id ? activeBgColor : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (currentProjectId !== project.id) {
                    e.currentTarget.style.borderColor = hoverBorderColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentProjectId !== project.id) {
                    e.currentTarget.style.borderColor = borderColor;
                  }
                }}
              >
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm mb-2" style={{ color: subTextColor }}>{project.description}</p>
                )}
                <p className="text-xs" style={{ color: subTextColor, opacity: 0.8 }}>
                  {project.updatedAt
                    ? new Date(project.updatedAt).toLocaleDateString()
                    : 'Recently updated'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

