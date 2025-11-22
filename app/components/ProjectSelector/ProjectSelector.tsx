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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (showCreateModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h2 className="text-xl font-bold mb-4">Create New Project</h2>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
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
            <p className="text-gray-600 mb-4">No projects found</p>
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
                className={`p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                  currentProjectId === project.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                )}
                <p className="text-xs text-gray-500">
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

