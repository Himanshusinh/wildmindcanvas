import React from 'react';
import { Home, Folder, Grid, Settings } from 'lucide-react';

interface ProjectDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProjectDrawer: React.FC<ProjectDrawerProps> = ({ isOpen, onClose }) => {
    // Mock Projects
    const projects = [
        { id: 1, name: 'Summer Vacation', date: '2 days ago', thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=100&fit=crop' },
        { id: 2, name: 'Product Demo', date: '1 week ago', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150&h=100&fit=crop' },
        { id: 3, name: 'Instagram Story', date: '2 weeks ago', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=150&h=100&fit=crop' },
    ];

    return (
        <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 z-[60] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-800">Projects</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <Settings size={18} />
                </button>
            </div>

            <div className="p-4 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
                    <Home size={18} /> Home
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Folder size={18} /> Your Projects
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Grid size={18} /> Brand Hub
                </button>
            </div>

            <div className="p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Designs</h3>
                <div className="space-y-3">
                    {projects.map(project => (
                        <div key={project.id} className="flex items-center gap-3 group cursor-pointer">
                            <img src={project.thumbnail} className="w-10 h-10 rounded object-cover border border-gray-200 group-hover:border-violet-500 transition-colors" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-violet-600 transition-colors">{project.name}</p>
                                <p className="text-[10px] text-gray-400">{project.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectDrawer;
