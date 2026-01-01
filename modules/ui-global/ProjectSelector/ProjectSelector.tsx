'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { listProjects, createProject, CanvasProject } from '@/core/api/canvasApi';
import { FolderPlus, X, Plus, Clock, Search, LayoutGrid } from 'lucide-react';

interface ProjectSelectorProps {
  onProjectSelect: (project: CanvasProject) => void;
  currentProjectId?: string | null;
  startWithCreate?: boolean;
}

export function ProjectSelector({ onProjectSelect, currentProjectId, startWithCreate }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<CanvasProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Untitled');
  const creatingRef = useRef(false); // Prevent duplicate creation requests
  const [isDark, setIsDark] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);

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

  // Helper to generate unique project name (Untitled, Untitled 1, etc.)
  const getUniqueProjectName = (existingProjects: CanvasProject[]) => {
    const baseName = "Untitled";
    const existingNames = new Set(existingProjects.map(p => p.name));

    if (!existingNames.has(baseName)) {
      return baseName;
    }

    let counter = 1;
    while (existingNames.has(`${baseName} ${counter}`)) {
      counter++;
    }
    return `${baseName} ${counter}`;
  };

  const handeOpenCreateModal = useCallback(() => {
    setNewProjectName(getUniqueProjectName(projects));
    setShowCreateModal(true);
  }, [projects]);

  // Handle startWithCreate prop - open modal once projects are loaded
  useEffect(() => {
    if (startWithCreate && !loading && !hasOpenedCreate && projects) {
      setHasOpenedCreate(true);
      // We need to pass the projects explicitly because state might not be updated in closure if we relied on 'projects' dependency only
      setNewProjectName(getUniqueProjectName(projects));
      setShowCreateModal(true);
    }
  }, [startWithCreate, loading, hasOpenedCreate, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const userProjects = await listProjects(20);
      setProjects(userProjects);

      // If no current project and we have projects, select the first one
      // BUT skip this if we are starting with create mode
      if (!currentProjectId && userProjects.length > 0 && !startWithCreate) {
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

      // Clear localStorage and URL BEFORE creating project to ensure clean state
      if (typeof window !== 'undefined') {
        // Clear old project data from localStorage
        localStorage.removeItem('canvas-project-id');
        localStorage.removeItem('canvas-project-name');

        // Clear URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('projectId');
        window.history.replaceState({}, '', newUrl.toString());
      }

      console.log('[ProjectSelector] Creating new project:', newProjectName.trim());
      const project = await createProject(newProjectName.trim());
      console.log('[ProjectSelector] New project created:', { id: project.id, name: project.name });

      setProjects(prev => [project, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('Untitled');

      // Select the newly created project immediately (no delay needed since we already cleared localStorage)
      console.log('[ProjectSelector] Selecting newly created project:', project.id);
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[20002] animate-in fade-in duration-200">
        <style>
          {`
            @keyframes modal-pop {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
            .create-modal-container {
              animation: modal-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .create-input-focus:focus {
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
            }
          `}
        </style>
        <div
          className="create-modal-container rounded-2xl p-8 w-[400px] border border-white/10 shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            color: textColor
          }}
        >
          {/* Subtle top gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <FolderPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Create Project</h2>
              <p className="text-xs opacity-60 font-medium">Start your next masterpiece</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-2 block">Project Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-4 py-3 rounded-xl mb-1 focus:outline-none border-2 transition-all create-input-focus font-medium"
                style={{
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
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
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:bg-white/5 active:scale-95 flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
                style={{ color: subTextColor }}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating || !newProjectName.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create Project</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[20001] animate-in fade-in duration-300">
      <div
        className="rounded-2xl p-8 w-full max-w-3xl max-h-[85vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        style={{
          backgroundColor: isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          color: textColor
        }}
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <LayoutGrid size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
              <p className="text-sm opacity-60 font-medium">Choose a project to continue working</p>
            </div>
          </div>
          <button
            onClick={handeOpenCreateModal}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-black/5 rounded-2xl border-2 border-dashed border-white/5">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-4">
              <FolderPlus size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="mb-8 opacity-60 max-w-xs text-center" style={{ color: subTextColor }}>Get started by creating your very first creative workspace.</p>
            <button
              onClick={handeOpenCreateModal}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/30"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className="group p-5 border-2 rounded-2xl cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-xl relative overflow-hidden flex flex-col gap-3"
                style={{
                  borderColor: currentProjectId === project.id ? activeBorderColor : 'rgba(255, 255, 255, 0.05)',
                  backgroundColor: currentProjectId === project.id ? activeBgColor : isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                }}
                onMouseEnter={(e) => {
                  if (currentProjectId !== project.id) {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentProjectId !== project.id) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                  }
                }}
              >
                {currentProjectId === project.id && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/10 rounded-bl-full flex items-start justify-end p-2 text-blue-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                )}

                <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors uppercase tracking-tight line-clamp-1">{project.name}</h3>

                {project.description ? (
                  <p className="text-sm line-clamp-2" style={{ color: subTextColor }}>{project.description}</p>
                ) : (
                  <p className="text-sm opacity-40 italic" style={{ color: subTextColor }}>No description</p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-2 border-t border-white/5">
                  <Clock size={12} className="opacity-40" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {project.updatedAt
                      ? new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Recently created'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

